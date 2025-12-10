import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { MessageService } from "./MessageService";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiError";

const sendMessage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req?.user as JwtPayload;

    // Handle multiple images (array)
    let images: string[] = [];
    if (req.files && "image" in req.files) {
        // Check if it's an array of files
        const fileArray = req.files.image as Express.Multer.File[];
        images = fileArray.map(file => `/image/${file.filename}`);
    }

    // Parse data if it's a string (when sent with multipart/form-data)
    let bodyData: any = req.body;
    if (req.body.data && typeof req.body.data === "string") {
        try {
            bodyData = JSON.parse(req.body.data);
        } catch (err) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid JSON in data field");
        }
    }

    const payload = {
        ...bodyData,
        image: images,
        sender: user.id,
    };

    console.log("Payload after parsing:", payload);

    const result = await MessageService.sendMessageToDB(payload);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Message sent successfully",
        data: result
    });
});


const getMessage = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const messages = await MessageService.getMessageFromDB(id, req.user as JwtPayload, req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Message Retrieved Successfully',
        data: messages,
    });
});

const replyMessage = catchAsync(async (req: Request, res: Response) => {
    const user = req?.user as JwtPayload;

    // Fixed: Changed from "images" to "image" to match sendMessage
    let images: string[] = [];
    if (req.files && "image" in req.files) {
        const fileArray = req.files.image as Express.Multer.File[];
        images = fileArray.map(file => `/image/${file.filename}`);
    }

    // Parse data if it's a string
    let bodyData: any = req.body;
    if (req.body.data && typeof req.body.data === "string") {
        try {
            bodyData = JSON.parse(req.body.data);
        } catch (err) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid JSON in data field");
        }
    }

    const payload = {
        ...bodyData,
        replyTo: req.params.messageId,
        image: images,
        sender: user.id,
    };

    const message = await MessageService.replyMessageToDB(payload);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Reply message sent successfully',
        data: message,
    });
});

export const messageController = {
    sendMessage,
    getMessage,
    replyMessage,
};