import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { SettingService } from "./Setting.Service";


// Create or update
const upsertSettings = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = await SettingService.upsertSettings(data);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Settings updated successfully",
      data: result
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

// Get settings
const getAllSettings = async (req: Request, res: Response) => {
  try {
    const result = await SettingService.getSettings();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Settings fetched successfully",
      data: result
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};
// Get Single settings
const specificSetting = async (req: Request, res: Response) => {
  try {
    const key = req.params.key; 
    const result = await SettingService.getSpecificSetting(key);
    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Setting not found"
      });
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Setting fetched successfully",
      data: result
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

export const SettingController = { upsertSettings, getAllSettings,specificSetting };