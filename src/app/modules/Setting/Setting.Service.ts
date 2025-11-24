import { ISettings, Settings } from "./Setting.model";


// Create or update single settings document
const upsertSettings = async (data: ISettings) => {
  const result = await Settings.findOneAndUpdate({}, data, {
    upsert: true,
    new: true
  });
  return result;
};


// Get all settings (single document)
const getSettings = async () => {
  const result = await Settings.findOne();
  return result;
};

const getSpecificSetting = async (key: string) => {
  const settingsDoc = await Settings.findOne(); 
  if (!settingsDoc) return null;
  const value = (settingsDoc as any)[key];
  return value ? { [key]: value } : null;
};
export const SettingService = {
  upsertSettings,
  getSettings ,getSpecificSetting
};