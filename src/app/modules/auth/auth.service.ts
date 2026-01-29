import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import AppError from '../../../errors/AppError';
import { emailHelper } from '../../../helpers/emailHelper';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import {
  IAuthResetPassword,
  IChangePassword,
  ILoginData,
  IVerifyEmail,
} from '../../../types/auth';
import cryptoToken from '../../../util/cryptoToken';
import generateOTP from '../../../util/generateOTP';
import { ResetToken } from '../resetToken/resetToken.model';
import { User } from '../user/user.model';
import { redisClient } from '../../../config/radisConfig';

const OTP_EXPIRATION = 5 * 60; // 5 minutes

// Login User

const loginUserFromDB = async (payload: ILoginData) => {
  const { email, password } = payload;

  const isExistUser = await User.findOne({ email }).select("+password");
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (!isExistUser.verified) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Please verify your account, then try to login again"
    );
  }

  const isMatch = await User.isMatchPassword(password, isExistUser.password);
  if (!isMatch) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password is incorrect!");
  }

  // Create Access Token
  const accessToken = jwtHelper.createToken(
    { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in
  );

  // Create Refresh Token
  const refreshToken = jwtHelper.refreshToken(
    { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_refresh_in
  );


  return {
    accessToken,
    refreshToken
  };
};


const getNewAccessToken = async (token: string) => {
  try {
    // 1️⃣ Verify Refresh Token
    const decoded = jwtHelper.verifyToken(
      token,
      config.jwt.jwt_secret as Secret
    ) as {
      id: string;
      role: string;
      email: string;
    };

    if (!decoded?.id || !decoded?.role || !decoded?.email) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid refresh token payload");
    }

    // 2️⃣ Check if user actually exists
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "User no longer exists");
    }


    // 3️⃣ Create a new access token
    const newAccessToken = jwtHelper.createToken(
      { id: user._id.toString(), role: user.role },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string
    );
    const newRefreshToken = jwtHelper.refreshToken(
      { id: user._id.toString(), role: user.role },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_refresh_in as string
    );

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken
    };
  } catch (error) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired refresh token"
    );
  }
};


// Verify Email or OTP
const resendOtpToDB = async (email: string) => {
  const isExistUser = await User.isExistUserByEmail(email);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const otp = generateOTP();
  const redisKey = `otp:verify:${email}`;
  await redisClient.setEx(redisKey, OTP_EXPIRATION, otp.toString());

  const values = { otp, email: isExistUser.email };
  const verifyEmailTemplate = emailTemplate.resendOtpTemplate(values);
  await emailHelper.sendEmail(verifyEmailTemplate);

  return { message: 'OTP sent to your email.' };
};


const verifyEmailToDB = async (payload: IVerifyEmail) => {
  const { email, oneTimeCode } = payload;
  const isExistUser = await User.findOne({ email }).select('+authentication');
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // Redis OTP check (both for verify and forget)
  const redisVerifyKey = `otp:verify:${email}`;
  const redisResetKey = `otp:reset:${email}`;

  let storedOTP = await redisClient.get(redisVerifyKey);
  let redisKeyUsed = redisVerifyKey;

  if (!storedOTP) {
    storedOTP = await redisClient.get(redisResetKey);
    redisKeyUsed = redisResetKey;
  }

  if (!storedOTP) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'OTP expired or not found');
  }

  if (storedOTP !== String(oneTimeCode)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Wrong OTP');
  }

  // OTP valid, delete from Redis
  await redisClient.del(redisKeyUsed);

  let message;
  let data;

  if (!isExistUser.verified) {
    await User.findOneAndUpdate(
      { _id: isExistUser._id },
      { verified: true, authentication: { oneTimeCode: null, expireAt: null } }
    );
    message = 'Email verified successfully.';
  } else {
    await User.findOneAndUpdate(
      { _id: isExistUser._id },
      {
        authentication: {
          isResetPassword: true,
          oneTimeCode: null,
          expireAt: null,
        },
      }
    );

    const createToken = cryptoToken();
    await ResetToken.create({
      user: isExistUser._id,
      token: createToken,
      expireAt: new Date(Date.now() + 5 * 60000),
    });
    message = 'Verification successful. Use this token to reset your password.';
    data = createToken;
  }
  return { data, message };
};

// Forget Password (Send OTP)

const forgetPasswordToDB = async (email: string) => {
  const isExistUser = await User.isExistUserByEmail(email);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const otp = generateOTP();
  const redisKey = `otp:reset:${email}`;
  await redisClient.setEx(redisKey, OTP_EXPIRATION, otp.toString());

  const values = { otp, email: isExistUser.email };
  const forgetPasswordTemplate = emailTemplate.resetPassword(values);
  await emailHelper.sendEmail(forgetPasswordTemplate);

  return { message: 'OTP sent to your email.' };
};

// Reset Password

const resetPasswordToDB = async (
  token: string,
  payload: IAuthResetPassword
) => {
  const { newPassword, confirmPassword } = payload;

  const isExistToken = await ResetToken.isExistToken(token);
  if (!isExistToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized.');
  }

  const isExistUser = await User.findById(isExistToken.user).select(
    '+authentication'
  );
  if (!isExistUser?.authentication?.isResetPassword) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "You don't have permission to reset the password. Please try 'Forgot Password' again."
    );
  }

  const isValid = await ResetToken.isExpireToken(token);
  if (!isValid) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Token expired. Please try again.'
    );
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "New password and Confirm password don't match!"
    );
  }

  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  const updateData = {
    password: hashPassword,
    authentication: { isResetPassword: false },
  };

  await User.findOneAndUpdate({ _id: isExistToken.user }, updateData, {
    new: true,
  });
};

// Change Password

const changePasswordToDB = async (
  user: JwtPayload,
  payload: IChangePassword
) => {
  const { currentPassword, newPassword, confirmPassword } = payload;
  const isExistUser = await User.findById(user.id).select('+password');
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const isMatch = await User.isMatchPassword(
    currentPassword,
    isExistUser.password
  );
  if (!isMatch) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Password is incorrect.');
  }

  if (currentPassword === newPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Please choose a different password.'
    );
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Password and Confirm password don't match."
    );
  }

  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await User.findOneAndUpdate(
    { _id: user.id },
    { password: hashPassword },
    { new: true }
  );
};

export const AuthService = {
  verifyEmailToDB,
  loginUserFromDB,
  forgetPasswordToDB,
  resetPasswordToDB,
  changePasswordToDB,
  resendOtpToDB,
  getNewAccessToken
};
