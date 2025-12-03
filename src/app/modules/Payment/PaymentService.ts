import stripe from '../../config/stripe.config';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import { Event } from '../ORGANIZER/Event/Event.model';
import { MainlandFee, User } from '../user/user.model';
import { TicketPurchase } from '../Ticket/ticket.model';


interface TICKETS {
  ticketType: string;
  quantity: number;
}
interface IUser {
  fullName: string;
  email: string;
  discountCode?: string;
  userId: string;
  phone: string;
  tickets: TICKETS[];
}

const createPaymentIntentEvent = async (eventId: string, userInfo: IUser) => {
  const { fullName, email, phone, tickets, discountCode, userId } = userInfo;

  // 1️⃣ Event check
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found!');
  }

  // 2️⃣ Event Status check - NEW
  if (event.EventStatus === 'UnderReview' || event.EventStatus === 'Rejected') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'This event is not available for ticket purchase at the moment!'
    );
  }

  // 3️⃣ Event Date check - NEW
  if (event.eventDate && new Date(event.eventDate) < new Date()) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Cannot purchase tickets for past events!'
    );
  }


  // 4️⃣ Ticket Sale Period check - NEW
  const now = new Date();

  // Check if ticket sale has started
  if (event.ticketSaleStart && new Date(event.ticketSaleStart) > now) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Ticket sales have not started yet!'
    );
  }

  // Check presale period
  if (event.preSaleStart && event.preSaleEnd) {
    const preSaleStartDate = new Date(event.preSaleStart);

    // If we're in presale period, you might want to add special logic
    // For now, just checking if presale has ended and regular sale hasn't started
    if (now < preSaleStartDate) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Presale has not started yet!'
      );
    }
  }

  // 5️⃣ Free Event check - NEW
  if (event.isFreeEvent) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'This is a free event. Payment is not required!'
    );
  }

  // 6️⃣ Tickets validation - NEW
  if (!tickets || tickets.length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please select at least one ticket!'
    );
  }

  let totalTicketPrice = 0;
  const updatedTickets: any[] = [];

  for (const selected of tickets) {
    // Quantity validation - NEW
    if (selected.quantity <= 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Ticket quantity must be greater than zero!'
      );
    }

    if (event.eventDate && new Date(event.eventDate) <= now) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Ticket sales have ended for this event!'
      );
    }

    const eventTicket = event.tickets?.find(t => t.type === selected.ticketType);
    if (!eventTicket) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `${selected.ticketType} ticket not found for this event!`
      );
    }

    if (eventTicket.availableUnits < selected.quantity) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Not enough ${selected.ticketType} tickets available!`
      );
    }

    const price = eventTicket.price;
    let discountPerTicket = 0;

    // 7️⃣ Discount calculation with proper date validation
    if (discountCode) {
      const validCode = event.discountCodes?.find(d => d.code === discountCode);
      if (!validCode) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Coupon code!');
      }

      // Improved date check - UPDATED
      if (validCode.expireDate) {
        const expireDate = new Date(validCode.expireDate);
        const currentDate = new Date();

        // Set time to start of day for fair comparison
        expireDate.setHours(23, 59, 59, 999);

        if (currentDate > expireDate) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'This Coupon code has expired!'
          );
        }
      }

      discountPerTicket = (price * validCode.percentage) / 100;
    }

    const finalPricePerTicket = price - discountPerTicket;
    totalTicketPrice += finalPricePerTicket * selected.quantity;

    updatedTickets.push({
      ticketType: selected.ticketType,
      quantity: selected.quantity,
      availableUnits: eventTicket.availableUnits,
      price,
      discountPerTicket,
      finalPricePerTicket,
    });
  }
  const mainLandFee = await MainlandFee.findOne();
  const mainlandFee = mainLandFee?.mainlandFee || 0;
  const totalAmount = totalTicketPrice + mainlandFee;

  if (totalAmount <= 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Total amount must be greater than zero.'
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not available');
  }

  // Stripe customer
  const stripeCustomer = await stripe.customers.create({ name: fullName, email });

  // Stripe Checkout session
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer: stripeCustomer.id,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: `Tickets for ${event.eventName}` },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      eventId: eventId.toString(),
      userId: user._id.toString(),
      fullName,
      attenEmail: email,
      attenPhone: phone,
      tickets: JSON.stringify(updatedTickets),
      totalAmount: totalAmount.toString(),
      mailLandFee: mainlandFee.toString(),
      discountCode: discountCode || '',
    },
    success_url: `${config.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.stripe.cancel_url}?purchase_id=cancelled`,
  });

  return { url: stripeSession.url, sessionId: stripeSession.id };
};

// Ticket Payment
const BuyTicket = async (payload: any) => {
  const { fullName, email, phone, tickets, userId } = payload;

  // Validate user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not available');
  }

  let totalTicketPrice = 0;
  const ticketDetails: any[] = [];

  // Validate and calculate ticket availability
  for (const ticket of tickets) {
    const availableTickets = await TicketPurchase.find({
      ownerId: ticket.sellerId,
      ticketType: ticket.ticketType,
      status: "onsell",
    });

    const availableQuantity = availableTickets.length;

    // Check availability
    if (availableQuantity === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `No ${ticket.ticketType} tickets available from seller ${ticket.sellerId}`
      );
    }

    if (availableQuantity < ticket.quantity) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Only ${availableQuantity} ${ticket.ticketType} ticket(s) available, but ${ticket.quantity} requested`
      );
    }

    // Calculate price for requested quantity
    const selectedTickets = availableTickets.slice(0, ticket.quantity);
    const ticketPrice = selectedTickets.reduce((sum, t) => sum + t.sellAmount, 0);
    totalTicketPrice += ticketPrice;

    ticketDetails.push({
      sellerId: ticket.sellerId,
      ticketType: ticket.ticketType,
      quantity: ticket.quantity,
      price: ticketPrice,
      ticketIds: selectedTickets.map(t => t._id),
      sellAmount: ticket.sellAmount,
    });
  }

  // Create Stripe customer
  const stripeCustomer = await stripe.customers.create({
    name: user.name,
    email: user.email,
  });

  // Create checkout session
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer: stripeCustomer.id,
    line_items: ticketDetails.map(detail => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${detail.quantity}x ${detail.ticketType} Ticket(s)`,
        },
        unit_amount: Math.round(detail.price * 100),
      },
      quantity: 1,
    })),
    metadata: {
      userId: user._id.toString(),
      fullName,
      email,
      phone,
      tickets: JSON.stringify(ticketDetails),
      totalAmount: totalTicketPrice.toFixed(2),
      type: "resellPurchase",
      resellerId: userId.toString(),
    },
    success_url: `${config.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.stripe.cancel_url}`,
  });

  return {
    sessionId: stripeSession.id,
    sessionUrl: stripeSession.url,
    totalAmount: totalTicketPrice,
  };
};



export const createPaymentService = {
  createPaymentIntentEvent,
  BuyTicket,
};
