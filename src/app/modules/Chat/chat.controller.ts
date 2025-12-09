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


export const ChatController = {
    createOneToOneChat
};
