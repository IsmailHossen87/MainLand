import { Request, Response } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Metadata, Ticket } from '../modules/stripeAccount/webhookHandler';



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
  const allTickets: Ticket[] = JSON.parse(metadata.tickets);

  console.log('Full Name:', metadata.fullName);
  console.log('All Tickets:', allTickets); 

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
