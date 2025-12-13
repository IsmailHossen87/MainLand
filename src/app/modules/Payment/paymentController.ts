import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createPaymentService } from './PaymentService';

// ================= Primary Event Ticket Purchase =================
const createEventPayment = catchAsync(async (req: Request, res: Response) => {
  const eventId = req.params.id;
  const userId = req.user?.id as string;
  const { fullName, email, phone, tickets, discountCode } = req.body;
  const paymentSession = await createPaymentService.createPaymentIntentEvent(
    eventId as string,
    { fullName, email, phone, tickets, discountCode, userId }
  );



  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Redirect to Stripe Checkout',
    data: paymentSession,
  });
});

// ================= Resell Ticket Payment =================
const buyTicket = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const eventId = req.params.id;
  const { fullName, email, phone, tickets } = req.body;

  const paymentSession = await createPaymentService.BuyTicket({ fullName, email, phone, tickets, userId, eventId });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Redirect to payment',
    data: paymentSession,
  });
});

export const PaymentController = {
  createEventPayment,
  buyTicket,
};
