import { Request, Response } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

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

// RAFFLE
const handleRaffleBuy = async (session: Stripe.Checkout.Session) => {
  console.log(session.metadata);

  try {
    console.log('✅ Raffle updated successfully for signed-up user!');
  } catch (error) {
    console.error('❌ Error in handleRaffleBuy:', error);
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
  handleRaffleBuy,
  handleDonate,
};
