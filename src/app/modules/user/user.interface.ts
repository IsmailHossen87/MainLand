import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

export interface IAuthProvider {
  provider: 'google' | 'credentials';
  providerId: string;
}

export type IUser = {
  name: string;
  role: USER_ROLES;
  contact: string;
  email: string;
  password: string;
  image?: string;
  bio?: string;
  status: 'Active' | 'Blocked';
  verified: boolean;
  auths:IAuthProvider[];

  personalInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
  };

  address?: {
    country?: string;
    city?: string;
    postalCode?: string;
    street?: string;
  };
  // StripeAccountInfo
  stripeAccountInfo?: {
    stripeCustomerId?: string;
    loginUrl?: string;
  } | null;
  location?: string;
  joinedDate: Date;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number | null;
    expireAt: Date | null;
  };
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
