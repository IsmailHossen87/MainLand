import stripe from '../../config/stripe.config';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import { Event } from '../ORGANIZER/Event/Event.model';
import { User } from '../user/user.model';
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

  let totalTicketPrice = 0;
  const updatedTickets: any[] = [];

  for (const selected of tickets) {
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

    // Discount calculation
    if (discountCode) {
      const validCode = event.discountCodes?.find(d => d.code === discountCode);
      if (!validCode) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Coupon code!');
      }

      if (validCode.expireDate && Date.now() > new Date(validCode.expireDate).getTime()) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'This Coupon code has expired!');
      }

      discountPerTicket = (price * validCode.percentage) / 100;
    }

    const finalPricePerTicket = price - discountPerTicket;
    totalTicketPrice += finalPricePerTicket * selected.quantity;

    updatedTickets.push({
      ticketType: selected.ticketType,
      quantity: selected.quantity,
      price,
      discountPerTicket,
      finalPricePerTicket,
    });
  }

  const mainlandFee = 0;
  const totalAmount = totalTicketPrice + mainlandFee;

  if (totalAmount <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Total amount must be greater than zero.');
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
// const BuyTicket = async (payload: any) => {
//   const { fullName, email, phone, tickets,userId } = payload;
//   const user = await User.findById(userId)
//   if(!user){
//     throw new ApiError(StatusCodes.NOT_FOUND, 'User not available');
//   }
//   const ticketType = tickets.map((item:any) => item.ticketType)
//   let totalTicketPrice = 0;

//   // Loop each requested ticket
//   for (const ticket of tickets) {
//     const oldTickets = await TicketPurchase.find({
//       ownerId: ticket.sellerId,
//       ticketType: ticket.ticketType,
//       status: "onsell",
//     });

//     const availableQuantity = oldTickets.length;
//     totalTicketPrice += oldTickets.reduce((total, ticket) => total + ticket.sellAmount, 0);


//     // ❌ If no tickets found
//     if (availableQuantity === 0) {
//       throw new ApiError(
//         400,
//         `No available ticket found for seller ${ticket.sellerId} and type ${ticket.ticketType}`
//       );
//     }
//     // ❌ If available < requested
//     if (availableQuantity < ticket.quantity) {
//       throw new ApiError(
//         400,
//         `Seller ${ticket.sellerId} has only ${availableQuantity} ${ticket.ticketType} tickets available, but you requested ${ticket.quantity}.`
//       );
//     }
//   }


//     const stripeCustomer = await stripe.customers.create({ name: user.name, email: user.email });

//     const stripeSession = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       mode: 'payment',
//       customer: stripeCustomer.id,
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd',
//             product_data: { name: `Tickets for ${ticketType}` },
//             unit_amount: Math.round(totalTicketPrice * 100),
//           },
//           quantity: 1,
//         },
//       ],
//       metadata: {
//         eventId: eventId.toString(),
//         userId: user._id.toString(),
//         fullName,
//         attenEmail: email,
//         attenPhone: phone,
//         tickets: JSON.stringify(updatedTickets),
//         totalAmount: totalAmount.toString(),
//         mailLandFee: mainlandFee.toString(),
//         discountCode: discountCode || '',
//       },
//       success_url: `${config.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${config.stripe.cancel_url}?purchase_id=cancelled`,
//     });


//   console.log("All ticket quantity validation passed!");
// };
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
      sellAmount:ticket.sellAmount,
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
      type: "resellPurchase"
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
