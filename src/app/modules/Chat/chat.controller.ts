import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { JwtPayload } from 'jsonwebtoken';
import { ChatService } from './chat.service';


const createOneToOneChat = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const { otherUserId } = req.params;

    const participants = [user?.id, otherUserId];

    const chat = await ChatService.createOneToOneChatToDB(participants);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Create Chat Successfully',
        data: chat,
    });
});

const getAllChatList = catchAsync(async (req, res) => {
    const user = req.user as JwtPayload;
    const search = req.query.search as string | undefined;

    const list = await ChatService.getAllChatList(user.id, search);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Chat list fetched successfully",
        data: list,
    });
});


// REPOST

const createReport = catchAsync(async (req: Request, res: Response) => {
    const reporter = req.user as JwtPayload;
    const { reportedUserId } = req.params;

    const payload = {
        ...req.body,
        reporterUserId: reporter.id,
        reportedUserId,
    };

    const result = await ChatService.createReport(payload);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User reported successfully",
        data: result,
    });
});

const getAllReports = catchAsync(async (req: Request, res: Response) => {
    const result = await ChatService.getAllReports();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Report list fetched successfully",
        data: result,
    });
});

const getReportsByUser = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const result = await ChatService.getReportsByUser(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User report list fetched",
        data: result,
    });
});


export const ChatController = {
    createOneToOneChat,
    createReport,
    getAllReports,
    getReportsByUser,
    getAllChatList
};
