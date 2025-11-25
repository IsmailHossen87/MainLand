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

export const SettingService = {
  updateSetting,
};



// // Get all settings (single document)
// const getSettings = async () => {
//   const result = await Settings.findOne();
//   return result;
// };

// const getSpecificSetting = async (key: string) => {
//   const settingsDoc = await Settings.findOne(); 
//   if (!settingsDoc) return null;
//   const value = (settingsDoc as any)[key];
//   return value ? { [key]: value } : null;
// };
