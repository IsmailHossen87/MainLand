import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ActionService } from "./ActionService";
import { JwtPayload } from "jsonwebtoken";
import { IJwtUser } from "../../../../types";

const statusChange = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as IJwtUser)?.id;
    const eventId = req.params.id
    const result = await ActionService.statusChange(userId as string, eventId as string)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Status Update Sucessfully",
      data: result,
    });
  }
);

const DashBoard = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const query = req.query
    const result = await ActionService.DashBoard(user as JwtPayload, query as Record<string, string>)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "DashBoard retrived Sucessfully",
      data: result,
    });
  }
);

const blockUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params?.id
    const adminInfo = req.user;
    const result = await ActionService.blockUser(userId as string, adminInfo as JwtPayload)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: result.message,
      data: result.user,
    });
  }
);
// // All User
const AllTicketBuyerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    const query = req.query
    const result = await ActionService.AllTicketBuyerUser(user as JwtPayload, query as Record<string, string>)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All User Retrived Sucessfully",
      meta: result.meta,
      data: result.data,
    });
  }
);
// ticket Activity
const ticketActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    const userId = req.params?.id
    const query = req.query

    const result = await ActionService.ticketActivity(user as JwtPayload, userId as string, query as Record<string, string>)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Ticket Activity Retrived Sucessfully",
      data: {
        meta: result.meta,
        data: result.data,

      },
    });
  }
);
const accountDeleteHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    const result = await ActionService.accountDeleteHistory(user as JwtPayload)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Account Delete History Retrived Sucessfully",
      data: result,
    });
  }
)
const allNotification = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    const query = req.query
    const result = await ActionService.allNotification(user as JwtPayload, query as Record<string, string>)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All Notification Retrived Sucessfully",
      meta: result.meta,
      data: result.data,
    });
  }
)

const ticketHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    const query = req.query
    const id = req?.params.id

    const result = await ActionService.ticketHistory(user as JwtPayload, query as Record<string, string>, id as string)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Ticket History Retrived Sucessfully",
      data: result,
    });
  }
)
// const allResellTicket = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const user = req.user
//     const query = req.query

//     const result = await ActionService.allResellTicket(user as JwtPayload, query as Record<string, string>)
//     await sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.OK,
//       message: "All Resell Ticket Retrived Sucessfully",
//       data: result,
//     });
//   }
// );



export const ActionController = {
  statusChange,
  DashBoard, blockUser, AllTicketBuyerUser, ticketActivity, accountDeleteHistory, allNotification, ticketHistory
}