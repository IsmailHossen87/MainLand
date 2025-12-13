import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { MessageService } from "./MessageService";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiError";
import { getMultipleFilesPath } from "../../../shared/getFilePath";

const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const imageFiles = getMultipleFilesPath(req.files, 'image')
    const documentFiles = getMultipleFilesPath(req.files, 'document')
    const user = req.user as JwtPayload;


    const payload = {
        ...req.body,
        image: imageFiles && imageFiles?.length > 0 ? imageFiles : [],
        files: documentFiles && documentFiles?.length > 0 ? documentFiles : [],
        sender: user.id,
    }

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

const updateMessage = catchAsync(async (req: Request, res: Response) => {
    const messageId = req.params.id;
    const user = req.user as JwtPayload;
    const payload = req.body;
    const result = await MessageService.updateMessageToDB(messageId, payload, user);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Message updated successfully',
        data: result,
    });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const messageId = req.params.id;
    const user = req.user as JwtPayload;
    const result = await MessageService.deleteMessageToDB(messageId, user);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Message deleted successfully',
        data: result,
    });
});

export const messageController = {
    sendMessage,
    getMessage,
    replyMessage,
    updateMessage,
    deleteMessage
};