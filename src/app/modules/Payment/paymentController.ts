import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createPaymentService } from "./PaymentService";
import { string } from "zod";


export const createPaymentIntentEvent = catchAsync(
  async (req: Request, res: Response) => {
    const eventId = req.params.id;
    const userId = req.user?.id 
    const { fullName, email, phone, tickets, discountCode } = req.body;

    const paymentSession = await createPaymentService.createPaymentIntentEvent(eventId,{fullName,email,phone,tickets,discountCode,userId });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Redirect to Stripe Checkout",
      data: paymentSession,
    });
  }
);


const createPaymentIntentRaffle = catchAsync(async (req: Request, res: Response) => {
  const raffleId = req.params.id;
  const { ticket, firstName, surName, email, message } = req.body;

  // const paymentSession = await createPaymentService.createPaymentIntent(
  //   raffleId,
  //   ticket,
  //   { firstName, surName, email, message }
  // );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Redirect to payment",
    // data: paymentSession,
  });
});



export const PaymentController = { createPaymentIntentRaffle,createPaymentIntentEvent };