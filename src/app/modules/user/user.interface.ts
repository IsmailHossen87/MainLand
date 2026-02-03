import { Model, Types } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

export interface IAuthProvider {
  provider: 'google' | 'credentials';
  providerId: string;
}
export interface IMainlandFee {
  mainlandFee: number;
}

export interface IAccountDelete {
  userId: Types.ObjectId,
  deleteReason: string,
  isDeleted: boolean
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
  sellAmount?: number;
  totalTicketPurchase?: number;
  withDrawAmount?: number;
  // StripeAccountInfo
  stripeAccountInfo?: {
    stripeAccountId?: string;
    stripeAccountStatus?: 'pending' | 'active' | 'restricted';
    pendingBalance: number;
    availableBalance: number;
    isCompleted: { type: Boolean, default: false },
    stripeConnectedAccount: { type: String },
    loginUrl?: string;
  } | null;
  location?: string;
  joinedDate: Date;
  totalEarnings: number;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number | null;
    expireAt: Date | null;
  };
  isSoundNotificationEnabled: boolean;
  isVibrationNotificationEnabled: boolean;
  terAndCondition: boolean;
  fcmToken?: string;
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
