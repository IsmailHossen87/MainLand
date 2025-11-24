import { Schema, model } from "mongoose";

export interface ISettings {
  privacyPolicy: string;
  cookiePolicy: string;
  termsAdnCondition: string;
  shippingPolicy: string;
}

const settingSchema = new Schema<ISettings>(
  {
    privacyPolicy: { type: String, required: true },
    cookiePolicy: { type: String, required: true },
    termsAdnCondition: { type: String, required: true },
    shippingPolicy: { type: String, required: true },
  },
  { timestamps: true,versionKey:false }
);

export const Settings = model<ISettings>("Settings", settingSchema);