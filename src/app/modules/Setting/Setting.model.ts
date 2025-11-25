import { Schema, model } from "mongoose";

export enum SettingType {
  TermsAndConditions = "terms_and_conditions",
  PrivacyPolicy = "privacy_policy",
  AboutUs = "about_us",
  ContactUs = "contact_us", 
  Faq = "faq",
}

export interface ISettings {
  type: SettingType;
  title: string;
  content: string;
}


const SettingsSchema = new Schema(
  {
    type: { type: String, enum: SettingType, required: true, unique: true }, 
    title: { type: String, required: true },
    content: { type: String, required: true }
  },
  { timestamps: true,versionKey: false }
);

export const Settings = model("Settings", SettingsSchema);


