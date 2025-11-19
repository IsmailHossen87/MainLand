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
 const availAbleTicket = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await ResellTicketService.availAbleTicket(req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All available resell tickets fetched successfully",
      data: result,
    });
  }
);
 const getLiveTicket = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await ResellTicketService.getLiveTicket(req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All Live ticket fetched successfully",
      data: result,
    });
  }
);
 const getSoldedTicket = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => { 
    const userId = req.user?.id
    const result = await ResellTicketService.getSoldedTicket( userId,req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All Sold tikcet retrived successfully",
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

export const ResellTicketController ={createResellListing,availAbleTicket,cancelResellListing,getLiveTicket,getSoldedTicket}