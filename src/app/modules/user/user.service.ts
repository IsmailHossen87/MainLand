import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { IUser } from './user.interface';
import { User } from './user.model';
import { redisClient } from '../../../config/radisConfig';
import stripe from '../../config/stripe.config';


const OTP_EXPIRATION = 2 * 60;

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  payload.role = USER_ROLES.USER;

  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  const otp = generateOTP();
  const redisKey = `otp:verify:${createUser.email}`;
  await redisClient.setEx(redisKey, OTP_EXPIRATION, otp.toString());

  const values = {
    name: createUser.name,
    otp,
    email: createUser.email!,
  };

  const createAccountTemplate = emailTemplate.createAccount(values);
  await emailHelper.sendEmail(createAccountTemplate);

  let stripeCustomer;
  try {
    stripeCustomer = await stripe.customers.create({
      email: createUser.email,
      name: createUser.name,
    });
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create Stripe customer'
    );
  }

  await User.findOneAndUpdate(
    {_id:createUser._id},
    {
      $set:{
        stripeAccountInfo:{stripeCustomerId:stripeCustomer.id}
      }
    }
  )

  return createUser;
};

const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};
const getAllUser = async () => {
  const isExistUser = await User.find();
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};



const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (payload.image) {
    unlinkFile(isExistUser.image);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  getAllUser,
  updateProfileToDB,
};
