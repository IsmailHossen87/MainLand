"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_model_1 = require("../user/user.model");
const chat_model_1 = require("./chat.model");
const message_model_1 = require("../Message/message-model");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const emailHelper_1 = require("../../../helpers/emailHelper");
const createOneToOneChatToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate we have exactly 2 participants
    if (payload.length !== 2) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'One-to-one chat requires exactly 2 participants');
    }
    // Check if users are trying to chat with themselves
    if (payload[0] === payload[1]) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot create chat with yourself');
    }
    const isExistChat = yield chat_model_1.Chat.findOne({
        participants: { $all: payload, $size: 2 },
    });
    if (isExistChat) {
        return isExistChat;
    }
    // Verify both participants exist
    const uniqueParticipants = [...new Set(payload)];
    const existingUsers = yield user_model_1.User.find({ _id: { $in: uniqueParticipants } });
    if (existingUsers.length !== uniqueParticipants.length) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'One or more participants do not exist');
    }
    const chat = yield chat_model_1.Chat.create({ participants: payload });
    return chat;
});
const getAllChatList = (userId, search) => __awaiter(void 0, void 0, void 0, function* () {
    const chats = yield chat_model_1.Chat.find({ participants: userId })
        .populate("participants", "name image")
        .sort({ updatedAt: -1 })
        .lean();
    const formatted = yield Promise.all(chats.map((chat) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const participants = chat.participants || [];
        const other = participants.find((p) => { var _a; return ((_a = p._id) === null || _a === void 0 ? void 0 : _a.toString()) !== userId; });
        // Fetch last message of the chat
        const lastMessageDoc = yield message_model_1.Message.findOne({ chatId: chat._id, isDeleted: false })
            .sort({ createdAt: -1 })
            .lean();
        let lastMessageText = null;
        let lastMessageRead = null;
        if (lastMessageDoc) {
            if (lastMessageDoc.text)
                lastMessageText = lastMessageDoc.text;
            else if ((_a = lastMessageDoc.image) === null || _a === void 0 ? void 0 : _a.length)
                lastMessageText = "[image]";
            lastMessageRead = lastMessageDoc.read;
        }
        return {
            id: (_b = chat._id) === null || _b === void 0 ? void 0 : _b.toString(),
            name: (other === null || other === void 0 ? void 0 : other.name) || "Unknown",
            photo: (other === null || other === void 0 ? void 0 : other.image) || null,
            lastMessage: lastMessageText,
            lastMessageTime: chat.updatedAt || chat.createdAt,
            lastMessageRead, // ✅ add read status
        };
    })));
    // Filter by search query if provided
    return formatted.filter((item) => {
        if (!search)
            return true;
        return item.name.toLowerCase().includes(search.toLowerCase());
    });
});
const createReport = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { reporterUserId, reportedUserId } = payload;
    if (reporterUserId.toString() === reportedUserId.toString()) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You cannot report yourself");
    }
    // Ensure both users exist
    const users = yield user_model_1.User.find({ _id: { $in: [reporterUserId, reportedUserId] } });
    if (users.length !== 2) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // Check for duplicate report
    const existing = yield chat_model_1.Report.findOne({ reporterUserId, reportedUserId });
    if (existing) {
        yield chat_model_1.Chat.updateMany({ participants: { $all: [reporterUserId, reportedUserId] } }, { status: false });
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You cannot report this user again or chat with them");
    }
    // Create new report
    const result = yield chat_model_1.Report.create(payload);
    // Send structured email to the REPORTED user
    const reportedUser = users.find(u => u._id.toString() === reportedUserId.toString());
    const reporter = users.find(u => u._id.toString() === reporterUserId.toString());
    if (reportedUser === null || reportedUser === void 0 ? void 0 : reportedUser.email) {
        try {
            const emailPayload = {
                reporterName: (reporter === null || reporter === void 0 ? void 0 : reporter.name) || "Someone",
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
            const emailSend = emailTemplate_1.emailTemplate.userReportConfirmation(emailPayload);
            yield emailHelper_1.emailHelper.sendEmail(emailSend);
            console.log("✅ Report email sent to reported user:", reportedUser.email);
        }
        catch (emailError) {
            console.error("❌ Error sending report email:", emailError);
        }
    }
    return result;
});
const getAllReports = () => __awaiter(void 0, void 0, void 0, function* () {
    const reports = yield chat_model_1.Report.find()
        .populate("reporterUserId", "full_name email")
        .populate("reportedUserId", "full_name email")
        .sort({ createdAt: -1 });
    return reports;
});
const getReportsByUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const reports = yield chat_model_1.Report.find({ reportedUserId: userId })
        .populate("reporterUserId", "full_name email")
        .populate("reportedUserId", "full_name email")
        .sort({ createdAt: -1 });
    return reports;
});
exports.ChatService = { createOneToOneChatToDB, createReport, getAllReports, getReportsByUser, getAllChatList };
