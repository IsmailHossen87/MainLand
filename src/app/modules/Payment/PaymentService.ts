import stripe from '../../config/stripe.config';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import { TicketPurchase } from '../user/Ticket/Purchase.Mode';
import { ITicketRequest } from '../user/Ticket/Purchase.Interface';
import { Types } from 'mongoose';
import { Event } from '../ORGANIZER/Event/Event.model';

interface IUserInfo {
  fullName: string;
  email: string;
  phone: string;
  tickets: ITicketRequest[];
  discountCode?: string;
  userId?: string;
}

const createPaymentIntentEvent = async (
  eventId: string,
  userInfo: IUserInfo
) => {
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
    const eventTicket = event.tickets?.find(
      t => t.type === selected.ticketType
    );

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

  // ✅ Step 5: Create purchase record
  const purchase = await TicketPurchase.create({
    eventId,
    userId,
    attenInformation: { fullName, email, phone },
    tickets: updatedTickets,
    mailLandFee: mainlandFee,
    totalAmount,
    discount: discountAmount,
  });

  // ✅ Step 6: Create Stripe customer
  const stripeCustomer = await stripe.customers.create({
    name: fullName,
    email,
    phone,
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
      purchaseId: purchase._id.toString(),
      eventId: event._id.toString(),
      totalAmount: String(totalAmount),
    },
    success_url: `${config.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.stripe.cancel_url}?purchase_id=${purchase._id}`,
  });

  // ✅ Step 8: Update purchase with session ID
  await TicketPurchase.findByIdAndUpdate(purchase._id, {
    stripeSessionId: stripeSession.id,
  });

  return {
    url: stripeSession.url,
    sessionId: stripeSession.id,
    purchaseId: purchase._id,
  };
};

// const createPaymentIntentCarity = async (
//   causeId: string,
//   amount: string,
//   userData: {
//     firstName: string;
//     surName: string;
//     email: string;
//     message?: string;
//   }
// ) => {
//   const charity = await Charities.findById(causeId);
//   if (!charity) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'Charity not found!');
//   }

//   const DonateAmount = Number(amount);
//   if (isNaN(DonateAmount)) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid donation amount');
//   }

//   // Find or create donor
//   let donner = await Dooner.findOne({ email: userData.email });
//   if (!donner) {
//     donner = await Dooner.create({
//       email: userData.email,
//       firstName: userData.firstName,
//       surName: userData.surName,
//       message: userData.message || '',
//       totalAmount: "",
//       paymentStatus: 'pending',
//       causeId: new mongoose.Types.ObjectId(causeId),
//     });
//   } else {
//     donner.totalAmount = 0;
//     donner.paymentStatus = 'pending';
//     donner.message = userData.message || donner.message;
//     donner.causeId = new mongoose.Types.ObjectId(causeId);
//     await donner.save();
//   }

//   // Create or reuse Stripe customer
//   let stripeCustomerId = donner.stripeCustomerId;
//   if (!stripeCustomerId) {
//     const stripeCustomer = await stripe.customers.create({
//       name: `${userData.firstName} ${userData.surName}`,
//       email: userData.email,
//     });
//     stripeCustomerId = stripeCustomer.id;
//     donner.stripeCustomerId = stripeCustomerId;
//     await donner.save();
//   }

//   const stripeSession = await stripe.checkout.sessions.create({
//     mode: 'payment',
//     payment_method_types: ['card'],
//     customer: stripeCustomerId,
//     line_items: [
//       {
//         price_data: {
//           currency: 'usd',
//           product_data: {
//             name: `Donation for - ${charity.pageTitle}`,
//           },
//           unit_amount: Math.round(DonateAmount * 100),
//         },
//         quantity: 1,
//       },
//     ],
//     metadata: {
//       doonerId: donner._id.toString(),
//       causeId: causeId,
//       totalAmount: DonateAmount.toString(),
//     },
//     success_url: `${config.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${config.stripe.cancel_url}?purchase_id=${donner._id}`,
//   });

//   await Dooner.findByIdAndUpdate(donner._id, {
//     stripeSessionId: stripeSession.id,
//   });

//   return {
//     url: stripeSession.url,
//     sessionId: stripeSession.id,
//     donnerId: donner._id,
//   };
// };

export const createPaymentService = {
  createPaymentIntentEvent,
  // createPaymentIntentCarity,
};
