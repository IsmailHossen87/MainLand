import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { SettingService } from "./Setting.Service";
import { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { IJwtUser } from "../../../types";


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
    const { type, question, answer, faqType } = req.body;

    if (!type) {
      throw new Error("Setting type is required");
    }
    const userId = req.user as JwtPayload;
    const result = await SettingService.faqSetting(userId, { type, question, answer, faqType });
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
    const faqType = req.params.faqType;
    const query = req.query;
    const result = await SettingService.getQuestion(userId, faqType, query as Record<string, string>);
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

// CONTACT
const contactCreate = async (req: Request, res: Response) => {
  let userId = (req.user as IJwtUser)?.id;

  const result = await SettingService.contactSetting(userId, req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Contact created successfully",
    data: result,
  });

};

const getContact = async (req: Request, res: Response) => {
  try {
    const query = req.query;
    const result = await SettingService.getContact(query as Record<string, string>);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Contact fetched successfully",
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

const getContactById = async (req: Request, res: Response) => {
  try {
    const result = await SettingService.getContactById(req.params.id as string);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Contact fetched successfully",
      data: result
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};
const contactEmail = async (req: Request, res: Response) => {
  try {
    const { adminMessage } = req.body;
    if (!adminMessage) {
      throw new Error("Admin message is required");
    }
    const userId = (req.user as IJwtUser)?.id;

    const result = await SettingService.contactEmail(req.params.id as string, adminMessage, userId);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Contact email message successfully",
      data: result
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};
const faqDelete = async (req: Request, res: Response) => {
  try {
    const result = await SettingService.faqDelete(req.params.id as string);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Faq deleted successfully",
      data: result
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

const faqUpdate = async (req: Request, res: Response) => {
  try {
    const result = await SettingService.faqUpdate(req.params.id as string, req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Faq updated successfully",
      data: result
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};

const deleteContact = async (req: Request, res: Response) => {
  try {
    const result = await SettingService.deleteContact(req.params.id as string);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Contact deleted successfully",
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
  getSpecificSetting,
  contactCreate,
  getContact,
  getContactById,
  contactEmail,
  faqDelete,
  faqUpdate,
  deleteContact,
};
