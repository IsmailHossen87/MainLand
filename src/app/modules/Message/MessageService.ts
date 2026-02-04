import { StatusCodes } from "http-status-codes";
import unlinkFile from "../../../shared/unlinkFile";
import { Chat } from "../Chat/chat.model";
import { IMessage } from "./message-interface";
import { Message } from "./message-model";
import mongoose from "mongoose";
import AppError from "../../../errors/AppError";
import { firebaseNotificationBuilder } from "../../../helpers/firebaseAdmin";
import { sendNotifications } from "../../../helpers/notificatio-helper";


const sendMessageToDB = async (payload: any) => {
    try {
        if (!payload.chatId) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Chat ID is required");
        }


        /* -------------------- CHAT FETCH -------------------- */
        const chat = await Chat.findById(payload.chatId).populate(
            "participants",
            "_id name email image isReported fcmToken"
        );

        if (!chat) {
            throw new AppError(StatusCodes.NOT_FOUND, "Chat not found");
        }

        if (!chat) {
            if (payload.image) payload.image.forEach((i: string) => unlinkFile(i));
            if (payload.files) payload.files.forEach((f: string) => unlinkFile(f));
            throw new AppError(StatusCodes.NOT_FOUND, "Chat not found");
        }

        if (chat.isReported) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Chat is reported");
        }

        // /* -------------------- OTHER PARTICIPANT -------------------- */
        const otherParticipant: any = chat.participants.find(
            (p: any) => p._id.toString() !== payload.sender?.toString()
        );

        // /* -------------------- MESSAGE CREATE -------------------- */
        const message = await Message.create(payload);


        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "_id name email image")
            .populate("replyTo", "_id sender text image files")
            .lean();

        if (!populatedMessage) {
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to populate message");
        }

        // /* -------------------- TRANSFORM MESSAGE -------------------- */
        const createMessageForParticipant = (participantId: string) => {
            const isSender = participantId === payload.sender?.toString();

            return {
                ...populatedMessage,
                sender: isSender ? otherParticipant : populatedMessage.sender,
                isOwnMessage: isSender,
                ownerId: populatedMessage.sender._id,
            };
        };

        // /* -------------------- CHAT UPDATE -------------------- */
        chat.lastText = payload.text || "";
        chat.lastImage = [...(payload.image || []), ...(payload.files || [])];
        await chat.save();

        // /* -------------------- SOCKET.IO -------------------- */
        // const io = (global as any).io;
        // if (io) {
        //     chat.participants.forEach((participant: any) => {
        //         const participantId = participant._id.toString();
        //         const messageForParticipant =
        //             createMessageForParticipant(participantId);

        //         io.emit(`message::${participantId}`, {
        //             ...messageForParticipant,
        //             image: [...(payload.image || []), ...(payload.files || [])],
        //         });
        //     });
        // }

        // /* -------------------- FIREBASE NOTIFICATION -------------------- */
        if (otherParticipant?.fcmToken) {
            try {
                const firebaseMessageData = createMessageForParticipant(otherParticipant._id.toString());

                const senderName = firebaseMessageData?.sender?.name || "New message";
                const senderImage = (firebaseMessageData?.sender as any)?.image || "";

                await firebaseNotificationBuilder({
                    user: otherParticipant,
                    title: senderName,
                    body: payload.text || "You received a new message",
                    image: payload.image?.[0] || "",
                    chatId: payload.chatId.toString(),
                    type: "MESSAGE",
                    avatar: senderImage,
                });

            } catch (err) {
                console.error("❌ Firebase Failed:", err);
            }
        }

        // ✅ Send notification for SOCKET
        sendNotifications(
            {
                chatId: `${payload.chatId.toString()}`,
                type: 'MESSAGE',
                receiver: otherParticipant?._id.toString() as string,
                read: false,
                title: "Event Status Updated",
                message: "You received a new message",
                status: "success",
            },
            "notification"
        )

        // /* -------------------- RETURN FOR SENDER -------------------- */
        return createMessageForParticipant(
            payload.sender?.toString() || ""
        ) as IMessage;

    } catch (error) {
        if (payload.image) payload.image.forEach((i: string) => unlinkFile(i));
        if (payload.files) payload.files.forEach((f: string) => unlinkFile(f));
        throw error;
    }
};



const getMessageFromDB = async (
    chatId: string,
    user: any,
    query: any
): Promise<IMessage[]> => {

    const chat = await Chat.findById(chatId).populate('participants', 'name image email');
    if (!chat) {
        throw new AppError(StatusCodes.NOT_FOUND, "Chat not found");
    }

    // Check if user is a participant (FIXED)
    const isParticipant = chat.participants.some(
        (p: any) => p._id.toString() === user.id
    );

    if (!isParticipant) {
        throw new AppError(StatusCodes.FORBIDDEN, "You are not a participant of this chat");
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

    await Message.updateMany({
        chatId: new mongoose.Types.ObjectId(chatId),
        sender: { $ne: new mongoose.Types.ObjectId(user.id) },
        read: false
    }, {
        $set: { read: true },
    });

    // Transform each message to show the other participant's info
    const transformedMessages = messages.map((msg: any) => {
        const { files, ...rest } = msg
        return {
            ...rest,
            image: [...msg.image, ...msg.files],
            sender: msg.sender._id.toString() === user.id
                ? otherParticipant
                : msg.sender,
            isOwnMessage: msg.sender._id.toString() === user.id,
            ownerId: msg.sender._id,
        };
    });

    return transformedMessages;
};


const replyMessageToDB = async (payload: Partial<IMessage>): Promise<IMessage> => {
    try {
        if (!payload.replyTo) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Reply To message ID is required");
        }

        if (!payload.text && (!payload.image || payload.image.length === 0)) {
            throw new AppError(StatusCodes.BAD_REQUEST, "Reply must contain text or image");
        }

        const parentMessage = await Message.findById(payload.replyTo);
        if (!parentMessage) {
            if (payload.image) payload.image.forEach((img) => unlinkFile(img));
            throw new AppError(StatusCodes.NOT_FOUND, "Parent message not found");
        }

        // Fetch chat with populated participants
        const chat = await Chat.findById(parentMessage.chatId)
            .populate('participants', '_id name email image');

        if (!chat) {
            if (payload.image) payload.image.forEach((img) => unlinkFile(img));
            throw new AppError(StatusCodes.NOT_FOUND, "Chat not found");
        }

        const isParticipant = chat.participants.some(
            (p: any) => p._id.toString() === payload.sender?.toString()
        );

        if (!isParticipant) {
            if (payload.image) payload.image.forEach((img) => unlinkFile(img));
            throw new AppError(StatusCodes.FORBIDDEN, "You are not a participant of this chat");
        }

        // Create reply message
        const replyMessage = await Message.create({
            chatId: parentMessage.chatId,
            replyTo: parentMessage._id,
            sender: payload.sender,
            text: payload.text,
            image: payload.image || [],
        });

        // Update parent message replies and chat in parallel
        const [populatedReplyMessage] = await Promise.all([
            // Populate the reply message
            Message.findById(replyMessage._id)
                .populate({
                    path: 'sender',
                    select: '_id name email image'
                })
                .populate({
                    path: 'replyTo',
                    select: '_id sender text image'
                })
                .lean(),

            // Update parent message
            Message.findByIdAndUpdate(parentMessage._id, {
                $push: { replies: replyMessage._id }
            }),

            // Update chat last activity
            Chat.findByIdAndUpdate(parentMessage.chatId, {
                lastText: payload.text || '',
                lastImage: payload.image || [],
            })
        ]);

        if (!populatedReplyMessage) {
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to populate reply message");
        }

        // SOCKET - Emit to all participants with populated data
        const io = (global as any).io;
        if (io) {
            chat.participants.forEach((participant: any) => {
                const participantId = participant._id.toString();

                // Create message with isOwnMessage flag
                const messageForParticipant = {
                    ...populatedReplyMessage,
                    isOwnMessage: participantId === payload.sender?.toString()
                };

                io.emit(`message::${participantId}`, messageForParticipant);
            });
        }

        // Return with isOwnMessage true for sender
        return {
            ...populatedReplyMessage,
            isOwnMessage: true
        } as IMessage;

    } catch (error) {
        if (payload.image) payload.image.forEach((img) => unlinkFile(img));
        throw error;
    }
};

const updateMessageToDB = async (messageId: string, payload: any, user: any): Promise<IMessage> => {
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new AppError(StatusCodes.NOT_FOUND, "Message not found");
        }

        if (message.sender.toString() !== user.id) {
            throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized to update this message");
        }

        const updatedMessage = await Message.findByIdAndUpdate(messageId, payload, { new: true });
        if (!updatedMessage) {
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update message");
        }

        return updatedMessage;
    } catch (error) {
        throw error;
    }
};

const deleteMessageToDB = async (messageId: string, user: any): Promise<IMessage> => {
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new AppError(StatusCodes.NOT_FOUND, "Message not found");
        }

        if (message.sender.toString() !== user.id) {
            throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized to delete this message");
        }

        const deletedMessage = await Message.findByIdAndUpdate(message._id, { isDeleted: true, text: "", image: [], files: [], replyTo: null }, { new: true });
        if (!deletedMessage) {
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete message");
        }

        return deletedMessage;
    } catch (error) {
        throw error;
    }
};

export const MessageService = {
    sendMessageToDB,
    getMessageFromDB,
    replyMessageToDB,
    updateMessageToDB,
    deleteMessageToDB
};
