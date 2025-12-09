import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose'; // ADDED: Missing import
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { Chat, IChat } from './chat.model';

const createOneToOneChatToDB = async (payload: string[]): Promise<IChat> => {
    // Validate we have exactly 2 participants
    if (payload.length !== 2) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'One-to-one chat requires exactly 2 participants');
    }

    // Check if users are trying to chat with themselves
    if (payload[0] === payload[1]) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot create chat with yourself');
    }

    const isExistChat: IChat | null = await Chat.findOne({
        participants: { $all: payload, $size: 2 },
    });

    if (isExistChat) {
        return isExistChat;
    }

    // Verify both participants exist
    const uniqueParticipants = [...new Set(payload)];
    const existingUsers = await User.find({ _id: { $in: uniqueParticipants } });

    if (existingUsers.length !== uniqueParticipants.length) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more participants do not exist');
    }

    const chat: IChat = await Chat.create({ participants: payload });
    return chat;
};

export const ChatService = { createOneToOneChatToDB };