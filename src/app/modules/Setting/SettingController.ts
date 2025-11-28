import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { SettingService } from "./Setting.Service";
import { JwtPayload } from "jsonwebtoken";


// Create or update
const updateSetting = async (req: Request, res: Response) => {
  try {
    const { type, title, content } = req.body;

    if (!type) {
      throw new Error("Setting type is required");
    }

    const result = await SettingService.updateSetting({ type, title, content });

    res.status(StatusCodes.OK).json({
      success: true,
      message: `${type} updated successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};


const faqCreate = async (req: Request, res: Response) => {
  try {
    const { type, question, answer } = req.body;

    if (!type) {
      throw new Error("Setting type is required");
    }
    const userId = req.user as JwtPayload;
    const result = await SettingService.faqSetting(userId, { type, question, answer });
    // check
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `${question} created successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
// const getSetting = async (req: Request, res: Response) => {
//   try { 
//     const { type } = req.query;
//     const result = await SettingService.getSettings();
//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Settings fetched successfully",
//       data: result
//     });
//   } catch (error: any) {
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

const getQuestion = async (req: Request, res: Response) => {
  try {
    const userId = req.user as JwtPayload;
    const query = req.query;
    const result = await SettingService.getQuestion(userId, query as Record<string, string>);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Settings fetched successfully",
      meta: result.meta,
      data: result.data
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

const getQuestionById = async (req: Request, res: Response) => {
  try {
    const result = await SettingService.getQuestionById(req.params.id as string);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Faq fetched successfully",
      data: result
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

const getSpecificSetting = async (req: Request, res: Response) => {
  try {
    const key = req.params.key; // "about_us"

    const result = await SettingService.getSpecificSetting(key);

    if (!result) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: `Setting '${key}' not found`
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

export const SettingController = {
  updateSetting,
  faqCreate,
  getQuestion,
  getQuestionById,
  getSpecificSetting
};
