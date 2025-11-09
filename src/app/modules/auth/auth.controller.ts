import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';
import config from '../../../config';
import { jwtHelper } from '../../../helpers/jwtHelper';
import ApiError from '../../../errors/ApiError';
import httpStatus from "http-status-codes";
import { JwtPayload } from 'jsonwebtoken';

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { ...verifyData } = req.body;
  const result = await AuthService.verifyEmailToDB(verifyData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await AuthService.loginUserFromDB(loginData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logged in successfully.',
    data: result.createToken,
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const email = req.body.email;
  const result = await AuthService.forgetPasswordToDB(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message:
      'Please check your email. We have sent you a one-time passcode (OTP).',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { ...resetData } = req.body;
  const result = await AuthService.resetPasswordToDB(token!, resetData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully reset.',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { ...passwordData } = req.body;
  await AuthService.changePasswordToDB(user as JwtPayload, passwordData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully changed',
  });
});

// 🔁 Google OAuth2 Callback
const googleCallbackController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let redirectTo = req.query.state ? (req.query.state as string) : "/";
    if (redirectTo.startsWith("/")) {
      redirectTo = redirectTo.slice(1);
    }

    const user = req.user as any; 
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // 🔐 Create JWT token for the logged-in user
    const token = jwtHelper.createToken(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      config.jwt.jwt_secret as string,
      config.jwt.jwt_expire_in as string
    );

    // 🔁 Option 1: Redirect with token as query parameter
    res.redirect(`${config.FRONTEND_URL}/${redirectTo}?token=${token}`);

    // 🔁 Option 2 (more secure): Set token in cookie
    /*
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: config.env === "production",
      sameSite: "lax",
    });
    res.redirect(`${config.FRONTEND_URL}/${redirectTo}`);
    */
  }
);

export const AuthController = {
  verifyEmail,
  loginUser,
  forgetPassword,
  resetPassword,
  changePassword,
  googleCallbackController
};