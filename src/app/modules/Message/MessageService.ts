import { StatusCodes } from "http-status-codes";
import { Types } from 'mongoose'; // ADDED: Missing import
import ApiError from "../../../errors/ApiError";
import unlinkFile from "../../../shared/unlinkFile";
import { Chat } from "../Chat/chat.model";
import { IMessage } from "./message-interface";
import { Message } from "./message-model";

const sendMessageToDB = async (payload: Partial<IMessage>): Promise<IMessage> => {
    // Validate required fields
    if (!payload.chatId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Chat ID is required');
    }
    console.log(payload)
    console.log("Chat Id", payload.chatId)

    if (!payload.text && !payload.image) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Message must contain text or image');
    }

    // Handle chatId exists
    const chat = await Chat.findById(payload.chatId).populate('participants', 'full_name image email');
    if (!chat) {
        if (payload.image) {
            unlinkFile(payload.image);
        }
        throw new ApiError(StatusCodes.NOT_FOUND, 'Chat not found');
    }

    // Verify sender is a participant
    const isSenderParticipant = chat.participants.some(
        (participant: any) => participant._id.toString() === payload.sender?.toString()
    );

    if (!isSenderParticipant) {
        if (payload.image) {
            unlinkFile(payload.image);
        }
        throw new ApiError(StatusCodes.FORBIDDEN, 'You are not a participant of this chat');
    }

    // Save to DB
    const response = await Message.create(payload);

    // If no response then return error and unlink the image if any
    if (!response) {
        if (payload.image) {
            unlinkFile(payload.image);
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send message');
    }

    // Socket.io notifications
    const io = (global as any).io; // FIXED: Better type casting
    if (io) {
        // Emit to chat room
        // io.emit(`message::${payload.chatId}`, response);

        // Emit to each participant except sender
        chat.participants.forEach((participant: any) => {
            if (participant._id.toString() !== payload.sender?.toString()) {
                io.emit(`message::${participant._id}`, response);
            }
        });
    }

    return response;
};

const getMessageFromDB = async (
    chatId: string,
    user: any,
    query: any
): Promise<IMessage[]> => {
    // Verify chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Chat not found');
    }

    const isParticipant = chat.participants.some(
        (participant) => participant.toString() === user.id
    );

    if (!isParticipant) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You are not a participant of this chat');
    }

    // Build query
    const messageQuery: any = {
        chatId: new Types.ObjectId(chatId),
        isDeleted: false,
    };

    // Get messages with pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find(messageQuery)
        .populate('sender', 'full_name image email')
        .populate('replyTo', 'text sender')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return messages as IMessage[];
};

const replyMessageToDB = async (payload: Partial<IMessage>): Promise<IMessage> => {
    // Validate required fields
    if (!payload.replyTo) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Reply To message ID is required');
    }

    if (!payload.text && !payload.image) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Reply must contain text or image');
    }

    // Find parent message
    const parentMessage = await Message.findById(payload.replyTo);
    if (!parentMessage) {
        if (payload.image) {
            unlinkFile(payload.image);
        }
        throw new ApiError(StatusCodes.NOT_FOUND, 'Parent message not found');
    }

    // Verify sender is a participant of the chat
    const chat = await Chat.findById(parentMessage.chatId);
    if (!chat) {
        if (payload.image) {
            unlinkFile(payload.image);
        }
        throw new ApiError(StatusCodes.NOT_FOUND, 'Chat not found');
    }

    const isSenderParticipant = chat.participants.some(
        (participant) => participant.toString() === payload.sender?.toString()
    );

    if (!isSenderParticipant) {
        if (payload.image) {
            unlinkFile(payload.image);
        }
        throw new ApiError(StatusCodes.FORBIDDEN, 'You are not a participant of this chat');
    }

    // Create reply message
    const replyMessage: Partial<IMessage> = {
        chatId: parentMessage.chatId,
        replyTo: parentMessage._id,
        sender: new Types.ObjectId(payload.sender),
        text: payload.text,
        image: payload.image,
    };

    const newMessage = await Message.create(replyMessage);

    if (!newMessage) {
        if (payload.image) {
            unlinkFile(payload.image);
        }
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send reply message');
    }

    // Add reply to parent message
    if (!parentMessage.replies) {
        parentMessage.replies = [];
    }
    parentMessage.replies.push(newMessage._id as Types.ObjectId);
    await parentMessage.save();

    // Emit socket event
    const io = (global as any).io;
    if (io) {
        io.emit(`getMessage::${parentMessage.chatId}`, newMessage);

        // Notify participants
        chat.participants.forEach((participant) => {
            if (participant.toString() !== payload.sender?.toString()) {
                io.emit(`getMessage::${participant}`, newMessage);
            }
        });
    }

    return newMessage;
};

export const MessageService = {
    sendMessageToDB,
    getMessageFromDB,
    replyMessageToDB
};
