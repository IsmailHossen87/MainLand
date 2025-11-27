import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { FavouriteService } from "./Favourite.service";
import mongoose from "mongoose";

const FavouriteCreate = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await FavouriteService.createFavourite(userId as string, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Favourite Created Successfully",
    data: result,
  });
});

export const FavouriteController = { FavouriteCreate };
