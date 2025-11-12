/* eslint-disable no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { TicketPurchaseService } from './Purchase.Service';


const BuyTicket = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => { 
    const userId = req.user?.id ;
    const eventId = req.params.id
    const userData  = req.body; 
    const result = await TicketPurchaseService.BuyTicket(userId as string,userData ,eventId as string);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Ticket Purchase successfully',
      data: null,
    });
  }
);

export const PurchaseController = {BuyTicket}