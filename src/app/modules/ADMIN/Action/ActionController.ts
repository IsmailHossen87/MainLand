import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ActionService } from "./ActionService";

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


export const ActionController ={statusChange}