import stripe from '../../config/stripe.config';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import { Event } from '../ORGANIZER/Event/Event.model';
import { User } from '../user/user.model';


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
const BuyTicket = async (payload: any) => { 
  console.log(payload)
  const { id, fullName, email, phone, totalTicket, buyerId } = payload;



};




export const createPaymentService = {
  createPaymentIntentEvent,
  BuyTicket,
};
