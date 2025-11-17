import stripe from '../../config/stripe.config';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import { Event } from '../ORGANIZER/Event/Event.model';
import { User } from '../user/user.model';
import { ResellTicket } from '../user/Ticket/Purchase.Mode';


interface TICKETS{
  ticketType:string,
  quantity:number
}
interface IUser{
  fullName:string,
  email:string,
  discountCode?:string,
  userId:string,
  phone:string,
  tickets:TICKETS[]
}


const createPaymentIntentEvent = async (eventId :string,userInfo:IUser) => {
  const { fullName, email, phone, tickets, discountCode, userId } = userInfo;

  // ✅ Step 1: Find the event
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found!');
  }

  // ✅ Step 2: Validate ticket availability and calculate total
  let totalTicketPrice = 0;
  const updatedTickets = [];

  for (const selected of tickets) {
    const eventTicket = event.tickets?.find(t => t.type === selected.ticketType ); 
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

    totalTicketPrice += eventTicket.price * selected.quantity;

    updatedTickets.push({
      ticketType: selected.ticketType,
      quantity: selected.quantity,
    });
  }

  // ✅ Step 3: Apply discount if code is valid
  let discountAmount = 0;
  if (discountCode && event.discountCodes?.length) {
    const validCode = event.discountCodes.find(d => d.code === discountCode);
    if (validCode) {
      discountAmount = (totalTicketPrice * validCode.percentage) / 100;
    }
  }

  const mainlandFee = 2;
  const totalAmount = totalTicketPrice + mainlandFee - discountAmount;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, `User is not Avaiable`);
  }

  // ✅ Step 6: Create Stripe customer
  const stripeCustomer = await stripe.customers.create({
    name: user?.name,
    email: user?.email,
  });

  // ✅ Step 7: Create Stripe checkout session
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer: stripeCustomer.id,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Tickets for ${event.eventName}`,
          },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      eventId: eventId.toString(),
      userId: user._id.toString(),
      totalAmount: String(totalAmount),
      fullName: fullName,
      attenEmail:email,
      attenPhone:phone,
      tickets: JSON.stringify(updatedTickets),
      mailLandFee:String(mainlandFee) ,
      discount:String(discountAmount) 
    }, 
    
    success_url: `${config.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.stripe.cancel_url}?purchase_id is Cancle`,
  });

  return {
    url: stripeSession.url,
    sessionId: stripeSession.id,
  };
};




// Ticket Payment
const createTicketPayment = async (payload:any) => {
  const { id, fullName, email, phone, userId } = payload;

  // ✅ Step 1: Find the event
  const ticket = await ResellTicket.findById(id);
  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found!');
  }
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, `User is not Avaiable`);
  }

  const stripeCustomer = await stripe.customers.create({
    name: user?.name,
    email:user.email,
  });

  // ✅ Step 7: Create Stripe checkout session
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer: stripeCustomer.id,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Tickets for ${ticket.ticketType}`,
          },
          unit_amount: Math.round(ticket.resellPrice * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      ticketId: ticket._id.toString(),
      userId: user._id.toString(),
      totalAmount: String(ticket.resellPrice),
      fullName: fullName,
      attenEmail:email,
      attenPhone:phone,  
    }, 
    
    success_url: `${config.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.stripe.cancel_url}?purchase_id is Cancle`,
  });

  return {
    url: stripeSession.url,
    sessionId: stripeSession.id,
  };
};


export const createPaymentService = {
  createPaymentIntentEvent,
  createTicketPayment,
};