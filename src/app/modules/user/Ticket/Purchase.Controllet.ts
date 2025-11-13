import { Request, Response, NextFunction } from "express";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ResellTicketService } from "./Purchase.Service";
import { JwtPayload } from "jsonwebtoken";


// 🎟️ Create new resell listing
 const createResellListing = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const result = await ResellTicketService.createResellListing(req.body, user as JwtPayload);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Ticket resell listing created successfully",
      data: result,
    });
  }
);


// 🎟️ Get all available resell tickets
 const getResellTickets = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await ResellTicketService.getResellTickets(req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All available resell tickets fetched successfully",
      data: result,
    });
  }
);

// 🎟️ Buy resell ticket
 const buyResellTicket = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { resellTicketId } = req.params;
    const buyer = req.user as JwtPayload;
    const result = await ResellTicketService.buyResellTicket(
      resellTicketId,
      buyer,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Ticket purchased successfully from resale",
      data: result,
    });
  }
);

// 🎟️ Cancel resell listing
 const cancelResellListing = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { resellTicketId } = req.params;
    const user = req.user as JwtPayload;
    const result = await ResellTicketService.cancelResellListing(
      resellTicketId,
      user
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Resell listing cancelled successfully",
      data: result,
    });
  }
);

export const ResellTicketController ={createResellListing,getResellTickets,buyResellTicket,cancelResellListing}