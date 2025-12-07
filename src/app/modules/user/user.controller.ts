/* eslint-disable no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';



const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    const result = await UserService.createUserToDB(userData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User created successfully',
      data: null,
    });
  }
);

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const userId = req.query.userId;
  console.log(userId)
  const result = await UserService.getUserProfileFromDB(user as JwtPayload, userId as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result
  });
});
const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await UserService.getAllUser(query as Record<string, string>);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Users data retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});
// count

//update profile
const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (req.files && "image" in req.files && req.files.image[0]) {
      req.body.image = `/image/${req.files.image[0].filename}`;
    }
    const data = {
      ...req.body,
    };
    const result = await UserService.updateProfileToDB(user as JwtPayload, data);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Profile updated successfully',
      data: result,
    });
  }
);

const imageDelete = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.imageDelete(user as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Image deleted successfully',
    data: result,
  });
});
const accountDelete = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { deleteReason, password } = req.body;
  if (!deleteReason || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Delete reason and password are required!');
  }
  const result = await UserService.accountDelete(user as JwtPayload, { deleteReason, password });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Account deleted successfully',
    data: result,
  });
});
const CreateAndUpdateMainlandFee = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  const { mainLandFee } = req.body;
  const result = await UserService.mainLandFee(user as JwtPayload, mainLandFee as number);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Mainland fee created/updated successfully',
    data: result,
  });
});

export const UserController = { createUser, getUserProfile, updateProfile, getAllUser, imageDelete, accountDelete, CreateAndUpdateMainlandFee };
