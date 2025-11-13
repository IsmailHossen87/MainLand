import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ActionService } from "./ActionService";
import { JwtPayload } from "jsonwebtoken";


const DashBoard = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user= req.user ;
    const query = req.query
    const result = await ActionService.DashBoard(user as JwtPayload, query as Record<string ,string>)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message:"DashBoard retrived Sucessfully",
      data: result,
    });
  }
);
// All User
const AllTicketBuyer = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user 
    const result = await ActionService.AllTicketBuyer(user as JwtPayload)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message:"All User Retrived Sucessfully",
      data: result,
    });
  }
);

const statusChange = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId= req.user?.id 
    const eventId = req.params.id 
    const result = await ActionService.statusChange(userId as string,eventId as string)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message:"Status Update Sucessfully",
      data: result,
    });
  }
);


export const ActionController ={DashBoard,AllTicketBuyer,statusChange}