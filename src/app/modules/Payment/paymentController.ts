import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createPaymentService } from "./PaymentService";

const createPaymentIntentRaffle = catchAsync(async (req: Request, res: Response) => {
  const raffleId = req.params.id;
  const { ticket, firstName, surName, email, message } = req.body;

  const paymentSession = await createPaymentService.createPaymentIntent(
    raffleId,
    ticket,
    { firstName, surName, email, message }
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Redirect to payment",
    data: paymentSession,
  });
});

// Charity
const createPaymentIntentCause = catchAsync(async (req: Request, res: Response) => {
  const causeId = req.params.id;
  const { totalAmount, firstName,email, surName, message } = req.body;

  const paymentSession = await createPaymentService.createPaymentIntentCarity(
    causeId,
    totalAmount,
    { firstName, surName,email,message }
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Redirect to Donation",
    data: paymentSession,
  });
});

export const PaymentController = { createPaymentIntentRaffle,createPaymentIntentCause };