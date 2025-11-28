import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

export interface IAuthProvider {
  provider: 'google' | 'credentials';
  providerId: string;
}
export interface INotification {
  isSellTicketNotificationEnabled: boolean
  isMessageNotificationEnabled: boolean
  isPublishEventNotificationEnabled: boolean
  isWithdrawMoneyNotificationEnabled: boolean
}

export type IUser = {
  name: string;
  role: USER_ROLES;
  email: string;
  password: string;
  image?: string;
  status: 'Active' | 'Blocked';
  verified: boolean;
  auths: IAuthProvider[];
  notification: INotification
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: Date
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
  terAndCondition: boolean;
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
