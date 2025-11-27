import { Schema, model } from "mongoose";

export enum SettingType {
  TermsAndConditions = "terms_and_conditions",
  PrivacyPolicy = "privacy_policy",
  AboutUs = "about_us",
  ContactUs = "contact_us",
  Faq = "faq"
}

export interface ISettings {
  type: SettingType;
  title: string;
  content: string;
  question: string,
  answer: string
}


const SettingsSchema = new Schema(
  {
    type: { type: String, enum: SettingType, required: true },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

export const Settings = model("Settings", SettingsSchema);


