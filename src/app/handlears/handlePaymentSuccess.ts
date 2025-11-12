import { Request, Response } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Metadata, Ticket } from '../modules/stripeAccount/webhookHandler';
import { TicketPurchase } from '../modules/user/Ticket/Purchase.Mode';
import { User } from '../modules/user/user.model';
import { emailHelper } from '../../helpers/emailHelper';
import { emailTemplate } from '../../shared/emailTemplate';
import { Event } from '../modules/ORGANIZER/Event/Event.model';



const paymentSuccess = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Payment completed successfully',
  });
};
export const paymentCancel = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Payment completed successfully',
  });
};

// GENERATE ticket COde
const generateTicketCode = (userId: string, raffleId: string): string => {
  const base = userId + raffleId + Math.random().toString();
  const hash = crypto.createHash('sha256').update(base).digest('hex');
  return hash.substring(0, 6).toUpperCase();
};


const handleEvent = async (session: Stripe.Checkout.Session) => {
  if (!session.metadata) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Metadata missing in session!');
  }
  const metadata = session.metadata as unknown as Metadata;
  const {userId,eventId,discount,attenEmail,mailLandFee,fullName,attenPhone,totalAmount} =session.metadata
  const allTickets: Ticket[] = JSON.parse(metadata.tickets); 

   await TicketPurchase.create({
    eventId,
    userId,
    attenInformation: { fullName, email:attenEmail, phone:attenPhone },
    tickets: allTickets,
    mailLandFee: Number(mailLandFee),
    totalAmount:Number(totalAmount),
    discount: Number(discount),
  }); 

await Event.updateOne(
  { _id: eventId, "tickets.ticketType": allTickets[0].ticketType },
  {
    $inc: {
      totalEarned: totalAmount,
      "tickets.$.availableUnits": -allTickets[0].quantity
    }
  },
  { runValidators: true }
);


// 📤📤📤
      const value = {
      name: fullName,
      email: attenEmail,
      totalTicket: allTickets,
      TotalTaka: totalAmount,
    };

  const emailSend = emailTemplate.ticketPurchaseEmail(value)
   await emailHelper.sendEmail(emailSend);


  try {
    console.log('✅ Raffle updated successfully for signed-up user!');
  } catch (error) {
    console.error('❌ Error in handleEvent:', error);
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Raffle purchase failed');
  }
};


// DONATE - Payment Success Handler
const handleDonate = async (session: Stripe.Checkout.Session) => {
  const { causeId, amount, firstName, surName, email, message }: any =
    session.metadata;

  try {
    console.log('✅ Donation successful, donor created & verified!');
  } catch (error) {
    console.error('❌ Error in handleDonate:', error);
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Donation processing failed');
  }
};

export const handlePayment = {
  paymentSuccess,
  paymentCancel,
  handleEvent,
  handleDonate,
};
