import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import unlinkFile from '../../../shared/unlinkFile';
import { IUser } from './user.interface';
import { isDeleted, User } from './user.model';
import stripe from '../../config/stripe.config';
import bcrypt from 'bcrypt';
import { USER_ROLES } from '../../../enums/user';

const OTP_EXPIRATION = 2 * 60;

export const generateRandomEmail = (name: string) => {
  const random = Math.floor(Math.random() * 100000);
  return `${name.toLowerCase()}${random}@gmail.com`;
};


const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  // ✨ Password hash করা
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

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
    { _id: createUser._id },
    {
      $set: {
        stripeAccountInfo: { stripeCustomerId: stripeCustomer.id }
      }
    }
  );

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

const updateProfileToDB = async (user: JwtPayload, payload: Partial<IUser>): Promise<Partial<IUser | null>> => {

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
const imageDelete = async (user: JwtPayload): Promise<IUser | null> => {
  const { id } = user;

  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (isExistUser.image) {
    unlinkFile(isExistUser.image);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, { image: null }, {
    new: true,
  });

  return updateDoc;
};
const accountDelete = async (
  user: JwtPayload,
  { deleteReason, password }: { deleteReason: string; password: string }
): Promise<IUser | null> => {

  const { id } = user;

  // 1️⃣ Check user exists
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  console.log("oldPassword", isExistUser.password);

  if (!isExistUser.password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password not found in DB!");
  }


  // 2️⃣ Verify password
  const isMatchPassword = await User.isMatchPassword(password, isExistUser.password);
  if (!isMatchPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password doesn't match!");
  }

  // 3️⃣ Delete profile image (if exists)
  if (isExistUser.image) {
    unlinkFile(isExistUser.image);
  }

  // 4️⃣ Update user → anonymize
  const updateDoc = await User.findOneAndUpdate(
    { _id: id },
    {
      name: "Anonymous",
      email: generateRandomEmail(isExistUser.name),
      role: USER_ROLES.DELETED,
      image: null,
    },
    { new: true }
  );

  // 5️⃣ Save deletion log
  await isDeleted.create({
    userId: id,
    deleteReason,
    isDeleted: true,
  });

  return updateDoc;
};


export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  getAllUser,
  updateProfileToDB,
  imageDelete,
  accountDelete,
};
