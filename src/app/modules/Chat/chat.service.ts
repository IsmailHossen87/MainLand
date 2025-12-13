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
    const { reporterUserId, chatId } = payload;

    // 1️⃣ Find the chat and populate participants
    const chat = await Chat.findById(chatId).populate('participants');
    if (!chat) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Chat not found");
    }

    // 2️⃣ Find the OTHER user (reported user) from participants
    const reportedUserId = chat.participants.find(
        (participantId) => participantId.toString() !== reporterUserId.toString()
    );

    if (!reportedUserId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Unable to identify reported user");
    }

    // 3️⃣ Self-report check
    if (reporterUserId.toString() === reportedUserId.toString()) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "You cannot report yourself");
    }

    // 4️⃣ Ensure both users exist
    const users = await User.find({ _id: { $in: [reporterUserId, reportedUserId] } });
    if (users.length !== 2) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    const reportedUser = users.find(u => u._id.toString() === reportedUserId.toString());
    const reporter = users.find(u => u._id.toString() === reporterUserId.toString());

    // 5️⃣ Check for existing report (1st or 2nd time reporting)
    const existingReport = await Report.findOne({
        reporterUserId,
        reportedUserId
    });

    if (existingReport) {
        // 🔴 2nd time report - Mark chat as reported and disable communication
        await Chat.updateOne(
            { _id: chatId },
            {
                isReported: true,
                status: false // Disable the chat
            }
        );

        // Optional: Delete all messages or mark them as inaccessible
        // await Message.deleteMany({ chatId });

        throw new ApiError(
            StatusCodes.FORBIDDEN,
            "You have already reported this user. Further communication is now disabled."
        );
    }

    // 6️⃣ Create new report (1st time)
    const result = await Report.create({
        ...payload,
        reportedUserId, // ✅ Now we have the reported user ID
    });

    // 7️⃣ Send email to REPORTED user
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

    // 8️⃣ Optional: Send warning email to REPORTER as well
    // 7️⃣ Send email to REPORTED user (1st time report only)
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