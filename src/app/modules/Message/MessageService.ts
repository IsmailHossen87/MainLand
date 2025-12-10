import { StatusCodes } from "http-status-codes";
import { Types } from 'mongoose'; // ADDED: Missing import
import ApiError from "../../../errors/ApiError";
import unlinkFile from "../../../shared/unlinkFile";
import { Chat } from "../Chat/chat.model";
import { IMessage } from "./message-interface";
import { Message } from "./message-model";

const sendMessageToDB = async (payload: Partial<IMessage>): Promise<IMessage> => {
    try {
        if (!payload.chatId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Chat ID is required");
        }

        if (!payload.text && (!payload.image || payload.image.length === 0)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Message must contain text or image");
        }

        const chat = await Chat.findById(payload.chatId);
        if (!chat) {
            if (payload.image) payload.image.forEach((img) => unlinkFile(img));
            throw new ApiError(StatusCodes.NOT_FOUND, "Chat not found");
        }

        // Sender must be a participant
        const isParticipant = chat.participants.some(
            (p) => p.toString() === payload.sender?.toString()
        );

        if (!isParticipant) {
            if (payload.image) payload.image.forEach((img) => unlinkFile(img));
            throw new ApiError(StatusCodes.FORBIDDEN, "You are not a participant of this chat");
        }

        // Create message
        const message = await Message.create(payload);

        if (!message) {
            if (payload.image) payload.image.forEach((img) => unlinkFile(img));
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send message");
        }

        // Update chat last activity
        const chatUpdate = chat.set({
            lastText: payload.text || '',
            lastImage: payload.image || [],
        });
        await chatUpdate.save();
        console.log("Chat updated:", chatUpdate);

        // Emit socket events
        const io = (global as any).io;
        if (io) {
            chat.participants.forEach((participant) => {
                if (participant.toString() !== payload.sender?.toString()) {
                    io.emit(`message::${participant}`, message);
                }
            });
        }

        return message;

    } catch (error) {
        if (payload.image) payload.image.forEach((img) => unlinkFile(img));
        throw error;
    }
};


// const getMessageFromDB = async (
//     chatId: string,
//     user: any,
//     query: any
// ): Promise<any> => {

//     const chat = await Chat.findById(chatId).populate('participants', 'full_name image email');
//     if (!chat) {
//         throw new ApiError(StatusCodes.NOT_FOUND, "Chat not found");
//     }

//     // Check if user is a participant (FIXED: was !== should be ===)
//     const isParticipant = chat.participants.some(
//         (p: any) => p._id.toString() === user.id
//     );

//     if (!isParticipant) {
//         throw new ApiError(StatusCodes.FORBIDDEN, "You are not a participant of this chat");
//     }

//     // Find the OTHER participant (not the current user)
//     const otherParticipant = chat.participants.find(
//         (p: any) => p._id.toString() !== user.id
//     );

//     const page = Number(query.page) || 1;
//     const limit = Number(query.limit) || 50;
//     const skip = (page - 1) * limit;

//     const messages = await Message.find({
//         chatId: chatId,
//         isDeleted: false,
//     })
//         .populate("sender", "full_name image email")
//         .populate("replyTo", "text sender image")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean();

//     // Return messages with other participant info
//     return {
//         messages,
//         otherParticipant: {
//             _id: otherParticipant?._id,
//             full_name: otherParticipant?.name,
//             image: otherParticipant?.image,
//             email: otherParticipant?.email,
//         }
//     };
// };

// const getMessageFromDB = async (
//     chatId: string,
//     user: any,
//     query: any
// ): Promise<any> => {

//     const chat = await Chat.findById(chatId).populate('participants', 'name image email');
//     if (!chat) {
//         throw new ApiError(StatusCodes.NOT_FOUND, "Chat not found");
//     }

//     // Type assertion for populated participants
//     const populatedParticipants = chat.participants as unknown as Array<{
//         _id: Types.ObjectId;
//         name: string;
//         image: string;
//         email: string;
//     }>;

//     // Check if user is a participant
//     const isParticipant = populatedParticipants.some(
//         (p) => p._id.toString() === user.id
//     );

//     if (!isParticipant) {
//         throw new ApiError(StatusCodes.FORBIDDEN, "You are not a participant of this chat");
//     }

//     // Find the OTHER participant (not the current user)
//     const otherParticipant = populatedParticipants.find(
//         (p) => p._id.toString() !== user.id
//     );

//     const page = Number(query.page) || 1;
//     const limit = Number(query.limit) || 50;
//     const skip = (page - 1) * limit;

//     const messages = await Message.find({
//         chatId: chatId,
//         isDeleted: false,
//     })
//         .populate("sender", "name image email")
//         .populate("replyTo", "text sender image")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean();

//     // Return messages with other participant info
//     return {
//         messages,
//         otherParticipant: otherParticipant ? {
//             _id: otherParticipant._id,
//             name: otherParticipant.name,
//             image: otherParticipant.image,
//             email: otherParticipant.email,
//         } : null
//     };
// };


// Alternative approach: Transform messages to always show other participant
const getMessageFromDB = async (
    chatId: string,
    user: any,
    query: any
): Promise<IMessage[]> => {

    const chat = await Chat.findById(chatId).populate('participants', 'name image email');
    if (!chat) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Chat not found");
    }

    // Check if user is a participant (FIXED)
    const isParticipant = chat.participants.some(
        (p: any) => p._id.toString() === user.id
    );

    if (!isParticipant) {
        throw new ApiError(StatusCodes.FORBIDDEN, "You are not a participant of this chat");
    }

    // Find the OTHER participant
    const otherParticipant = chat.participants.find(
        (p: any) => p._id.toString() !== user.id
    );

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
        chatId: chatId,
        isDeleted: false,
    })
        .populate("sender", "name image email")
        .populate("replyTo", "text sender image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Transform each message to show the other participant's info
    const transformedMessages = messages.map((msg: any) => {
        return {
            ...msg,
            // If sender is current user, show other participant
            // If sender is other user, keep as is
            sender: msg.sender._id.toString() === user.id
                ? otherParticipant
                : msg.sender,
            isOwnMessage: msg.sender._id.toString() === user.id
        };
    });

    return transformedMessages;
};


const replyMessageToDB = async (payload: Partial<IMessage>): Promise<IMessage> => {
    try {
        if (!payload.replyTo) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Reply To message ID is required");
        }

        if (!payload.text && (!payload.image || payload.image.length === 0)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Reply must contain text or image");
        }

        const parentMessage = await Message.findById(payload.replyTo);
        if (!parentMessage) {
            if (payload.image) payload.image.forEach((img) => unlinkFile(img));
            throw new ApiError(StatusCodes.NOT_FOUND, "Parent message not found");
        }

        const chat = await Chat.findById(parentMessage.chatId);
        if (!chat) {
            if (payload.image) payload.image.forEach((img) => unlinkFile(img));
            throw new ApiError(StatusCodes.NOT_FOUND, "Chat not found");
        }

        const isParticipant = chat.participants.some(
            (p) => p.toString() === payload.sender?.toString()
        );

        if (!isParticipant) {
            if (payload.image) payload.image.forEach((img) => unlinkFile(img));
            throw new ApiError(StatusCodes.FORBIDDEN, "You are not a participant of this chat");
        }

        const replyMessage = await Message.create({
            chatId: parentMessage.chatId,
            replyTo: parentMessage._id,
            sender: payload.sender,
            text: payload.text,
            image: payload.image || [],
        });

        parentMessage.replies?.push(replyMessage._id);
        await parentMessage.save();

        // SOCKET
        const io = (global as any).io;
        if (io) {
            chat.participants.forEach((participant) => {
                if (participant.toString() !== payload.sender?.toString()) {
                    io.emit(`message::${participant}`, replyMessage);
                }
            });
        }

        return replyMessage;

    } catch (error) {
        if (payload.image) payload.image.forEach((img) => unlinkFile(img));
        throw error;
    }
};


export const MessageService = {
    sendMessageToDB,
    getMessageFromDB,
    replyMessageToDB
};
