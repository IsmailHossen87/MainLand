import { Schema, model } from "mongoose";
export enum IEnum { Vanue = "vanue", User = 'user' }

export enum SettingType {
  TermsAndConditions = "terms_and_conditions",
  PrivacyPolicy = "privacy_policy",
  AboutUs = "about_us",
  Faq = "faq",
  Contact = "contact"
}

export interface ISettings {
  type: SettingType;
  title: string;
  content: string;
  question: string,
  answer: string,
  faqType: IEnum
}


const SettingsSchema = new Schema(
  {
    type: { type: String, enum: SettingType, required: true },
    title: { type: String, default: "" },
    faqType: { type: String, enum: IEnum, default: "" },
    content: { type: String, default: "" },
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);


export const Settings = model("Settings", SettingsSchema);

export interface IContact {
  userId: Schema.Types.ObjectId;
  email: string;
  status: 'pending' | 'solved' | 'rejected'
  message: string,
  adminMessage: string,
  adminId: Schema.Types.ObjectId,
}

const ContactSchema = new Schema<IContact>(
  {
    userId: { type: String, default: "" },
    email: { type: String, default: "" },
    status: { type: String, enum: ['pending', 'solved', 'rejected'], default: "pending" },
    message: { type: String, default: "" },
    adminMessage: { type: String, default: "" },
    adminId: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

export const Contact = model("Contact", ContactSchema);
