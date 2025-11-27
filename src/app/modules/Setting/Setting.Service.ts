import { JwtPayload } from "jsonwebtoken";
import { USER_ROLES } from "../../../enums/user";
import { ISettings, Settings } from "./Setting.model";


// Create or update single settings document
const updateSetting = async (data: { type: string; title: string; content: string }) => {
  const { type, title, content } = data;

  const result = await Settings.findOneAndUpdate(
    { type },
    { title, content },
    { upsert: true, new: true }
  );

  return result;
};

const faqSetting = async (user: JwtPayload, data: { type: string; question: string, answer: string[] }) => {
  const { type, question, answer } = data;
  if (USER_ROLES.ADMIN != user.role) {
    throw new Error("You are not authorized to create faq");
  }
  const result = await Settings.create({ type, question, answer, userId: user.id });
  return result;
};
// get all faq
const getQuestion = async (user: JwtPayload) => {
  if (USER_ROLES.ADMIN != user.role) {
    throw new Error("You are not authorized to get faq");
  }
  const result = await Settings.find({ type: "faq", userId: user.id });
  return result;
}

const getQuestionById = async (id: string) => {
  const result = await Settings.findById(id);
  if (!result) {
    throw new Error("Question not found");
  }
  return result;
}

const getSpecificSetting = async (key: string) => {
  // key কে SettingType এ convert করুন
  const setting = await Settings.findOne({ type: key });

  if (!setting) {
    return null;
  }

  return setting;
};

export const SettingService = {
  updateSetting,
  faqSetting,
  getQuestion,
  getQuestionById,
  getSpecificSetting
};



// // Get all settings (single document)
// const getSettings = async () => {
//   const result = await Settings.findOne();
//   return result;
// };


