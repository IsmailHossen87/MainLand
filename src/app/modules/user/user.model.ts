import bcrypt from 'bcrypt';
import { model, Schema } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
import { IAccountDelete, IAuthProvider, IMainlandFee, IUser, UserModal } from './user.interface';

const authProviderSchema = new Schema<IAuthProvider>({
  provider: { type: String, required: true },
  providerId: { type: String, required: true },
});

// IS DELETED SCHEMA
const isDeletedSchema = new Schema<IAccountDelete>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  deleteReason: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
export const isDeleted = model<IAccountDelete, UserModal>('isDeleted', isDeletedSchema);

// MAINLAND FEE
const mainlandFeeSchema = new Schema<IMainlandFee>({
  mainlandFee: {
    type: Number,
    default: 1,
    min: [0.01, 'Mainland fee must be greater than 0'],
    max: [100, 'Mainland fee cannot be greater than 100'],
    validate: {
      validator: function (value: number) {
        return value > 0 && value <= 100;
      },
      message: 'Mainland fee must be between 0.01 and 100'
    }
  },
}, { timestamps: true, versionKey: false });

export const MainlandFee = model<IMainlandFee>('MainlandFee', mainlandFeeSchema);

// USER SCHEMA
const userSchema = new Schema<IUser, UserModal>(
  {
    name: {
      type: String
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    auths: [authProviderSchema],
    image: {
      type: String,
      default: 'https://i.ibb.co/z5YHLV9/profile.png',
    },
    joinedDate: { type: Date, default: Date.now },
    stripeAccountInfo: {
      stripeCustomerId: {
        type: String,
        required: false,
      },
      stripeAccountId: {
        type: String,
        required: false,
      },
      loginUrl: {
        type: String,
        required: false,
      },
    },
    status: {
      type: String,
      enum: ['Active', 'Blocked'],
      default: 'Active',
    },
    sellAmount: {
      type: Number,
      default: 0,
    },
    withDrawAmount: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    terAndCondition: {
      type: Boolean,
      default: false,
    },
    personalInfo: {
      firstName: { type: String, default: '' },
      lastName: { type: String, default: '' },
      phone: { type: String, default: '' },
      dateOfBirth: { type: Date }
    },
    address: {
      country: { type: String, default: 'United States' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      street: { type: String, default: '' },
    },
    notification: {
      isSellTicketNotificationEnabled: { type: Boolean, default: true },
      isMessageNotificationEnabled: { type: Boolean, default: true },
      isPublishEventNotificationEnabled: { type: Boolean, default: true },
      isWithdrawMoneyNotificationEnabled: { type: Boolean, default: true },
    },
    authentication: {
      type: {
        isResetPassword: { type: Boolean, default: false },
        oneTimeCode: { type: Number, default: null },
        expireAt: { type: Date, default: null },
      },
      select: 0,
    },
  },
  { timestamps: true, versionKey: false }
);

// check user exists
userSchema.statics.isExistUserById = async (id: string) => {
  return await User.findById(id);
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

// match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};



export const User = model<IUser, UserModal>('User', userSchema);

