import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose'; // ADDED: Missing import
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { Chat, IChat, IReport, Report } from './chat.model';
import { Message } from '../Message/message-model';
import { emailTemplate } from '../../../shared/emailTemplate';
import { emailHelper } from '../../../helpers/emailHelper';
type ChatListItem = {
    id: string;
    name: string;
    photo: string | null;
    lastMessageTime: Date | null;
    lastMessage: string | null;
};

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

const getAllChatList = async (userId: string, search?: string) => {
    const chats = await Chat.find({ participants: userId })
        .populate("participants", "name image")
        .sort({ updatedAt: -1 })
        .lean();

    const formatted = await Promise.all(
        chats.map(async (chat: any) => {
            const participants: any[] = chat.participants || [];

            const other = participants.find((p: any) =>
                p._id?.toString() !== userId
            );

            // Fetch last message of the chat
            const lastMessageDoc = await Message.findOne({ chatId: chat._id, isDeleted: false })
                .sort({ createdAt: -1 })
                .lean();

            let lastMessageText: string | null = null;
            let lastMessageRead: boolean | null = null;

            if (lastMessageDoc) {
                if (lastMessageDoc.text) lastMessageText = lastMessageDoc.text;
                else if (lastMessageDoc.image?.length) lastMessageText = "[image]";

                lastMessageRead = lastMessageDoc.read;
            }

            return {
                id: chat._id?.toString(),
                name: other?.name || "Unknown",
                photo: other?.image || null,
                lastMessage: lastMessageText,
                lastMessageTime: chat.updatedAt || chat.createdAt,
                lastMessageRead, // ✅ add read status
            };
        })
    );

    // Filter by search query if provided
    return formatted.filter((item) => {
        if (!search) return true;
        return item.name.toLowerCase().includes(search.toLowerCase());
    });
};




const createReport = async (payload: IReport) => {
    const { reporterUserId, reportedUserId } = payload;

    if (reporterUserId.toString() === reportedUserId.toString()) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "You cannot report yourself");
    }

    // Ensure both users exist
    const users = await User.find({ _id: { $in: [reporterUserId, reportedUserId] } });
    if (users.length !== 2) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    // Check for duplicate report
    const existing = await Report.findOne({ reporterUserId, reportedUserId });
    if (existing) {
        await Chat.updateMany(
            { participants: { $all: [reporterUserId, reportedUserId] } },
            { status: false }
        );
        throw new ApiError(StatusCodes.FORBIDDEN, "You cannot report this user again or chat with them");
    }

    // Create new report
    const result = await Report.create(payload);

    // Send structured email to the REPORTED user
    const reportedUser = users.find(u => u._id.toString() === reportedUserId.toString());
    const reporter = users.find(u => u._id.toString() === reporterUserId.toString());

    if (reportedUser?.email) {
        try {
            const emailPayload = {
                reporterName: reporter?.name || "Someone",
                reportedUserName: reportedUser.name,
                reportedUserEmail: reportedUser.email,
                reportDetails: {
                    Privacy_concerns: payload.Privacy_concerns,
                    Obscene: payload.Obscene,
                    Defamation: payload.Defamation,
                    Copyright_violations: payload.Copyright_violations,
                    Erotic_content: payload.Erotic_content,
                    Others: payload.Others || "N/A",
                },
                reportDate: result.createdAt,
            };

            const emailSend = emailTemplate.userReportConfirmation(emailPayload);
            await emailHelper.sendEmail(emailSend);

            console.log("✅ Report email sent to reported user:", reportedUser.email);
        } catch (emailError) {
            console.error("❌ Error sending report email:", emailError);
        }
    }

    return result;
};


const getAllReports = async () => {
    const reports = await Report.find()
        .populate("reporterUserId", "full_name email")
        .populate("reportedUserId", "full_name email")
        .sort({ createdAt: -1 });

    return reports;
};

const getReportsByUser = async (userId: string) => {
    const reports = await Report.find({ reportedUserId: userId })
        .populate("reporterUserId", "full_name email")
        .populate("reportedUserId", "full_name email")
        .sort({ createdAt: -1 });

    return reports;
};
export const ChatService = { createOneToOneChatToDB, createReport, getAllReports, getReportsByUser, getAllChatList };