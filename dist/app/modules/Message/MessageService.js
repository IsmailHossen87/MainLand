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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const chat_model_1 = require("../Chat/chat.model");
const message_model_1 = require("./message-model");
const mongoose_1 = __importDefault(require("mongoose"));
const sendMessageToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!payload.chatId) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Chat ID is required");
        }
        // ✅ Updated validation
        if (!payload.text &&
            (!payload.image || payload.image.length === 0) &&
            (!payload.files || payload.files.length === 0)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Message must contain text, image, or document");
        }
        // ✅ Populate participants to get other user info
        const chat = yield chat_model_1.Chat.findById(payload.chatId).populate('participants', 'name image email isReported');
        if (chat === null || chat === void 0 ? void 0 : chat.isReported) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Chat is reported");
        }
        if (!chat) {
            // ✅ Clean up both images and files
            if (payload.image)
                payload.image.forEach((img) => (0, unlinkFile_1.default)(img));
            if (payload.files)
                payload.files.forEach((file) => (0, unlinkFile_1.default)(file));
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Chat not found");
        }
        // ✅ Find the OTHER participant
        const otherParticipant = chat.participants.find((p) => { var _a; return p._id.toString() !== ((_a = payload.sender) === null || _a === void 0 ? void 0 : _a.toString()); });
        const message = yield message_model_1.Message.create(payload);
        if (!message) {
            if (payload.image)
                payload.image.forEach((img) => (0, unlinkFile_1.default)(img));
            if (payload.files)
                payload.files.forEach((file) => (0, unlinkFile_1.default)(file));
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to send message");
        }
        const populatedMessage = yield message_model_1.Message.findById(message._id)
            .populate({
            path: 'sender',
            select: '_id name email image'
        })
            .populate({
            path: 'replyTo',
            select: '_id sender text image files',
        })
            .lean();
        if (!populatedMessage) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to populate message");
        }
        // ✅ Transform message for each participant
        const createMessageForParticipant = (participantId) => {
            var _a;
            const isSender = participantId === ((_a = payload.sender) === null || _a === void 0 ? void 0 : _a.toString());
            return Object.assign(Object.assign({}, populatedMessage), { sender: isSender ? otherParticipant : populatedMessage.sender, isOwnMessage: isSender, ownerId: populatedMessage.sender._id });
        };
        const chatUpdate = chat.set({
            lastText: payload.text || '',
            lastImage: payload.image || [],
        });
        yield chatUpdate.save();
        const io = global.io;
        if (io) {
            chat.participants.forEach((participant) => {
                const participantId = participant._id.toString();
                const messageForParticipant = createMessageForParticipant(participantId);
                io.emit(`message::${participantId}`, Object.assign(Object.assign({}, messageForParticipant), { image: [...payload.image, ...payload.files] }));
            });
        }
        // ✅ Return transformed message for the sender
        return createMessageForParticipant(((_a = payload.sender) === null || _a === void 0 ? void 0 : _a.toString()) || '');
    }
    catch (error) {
        if (payload.image)
            payload.image.forEach((img) => (0, unlinkFile_1.default)(img));
        if (payload.files)
            payload.files.forEach((file) => (0, unlinkFile_1.default)(file));
        throw error;
    }
});
const getMessageFromDB = (chatId, user, query) => __awaiter(void 0, void 0, void 0, function* () {
    const chat = yield chat_model_1.Chat.findById(chatId).populate('participants', 'name image email');
    if (!chat) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Chat not found");
    }
    // Check if user is a participant (FIXED)
    const isParticipant = chat.participants.some((p) => p._id.toString() === user.id);
    if (!isParticipant) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not a participant of this chat");
    }
    // Find the OTHER participant
    const otherParticipant = chat.participants.find((p) => p._id.toString() !== user.id);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const messages = yield message_model_1.Message.find({
        chatId: chatId,
        isDeleted: false,
    })
        .populate("sender", "name image email")
        .populate("replyTo", "text sender image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    console.log("ChatId", new mongoose_1.default.Types.ObjectId(chatId), "Sender Not Id", { sender: { $ne: user.id } });
    yield message_model_1.Message.updateMany({
        chatId: new mongoose_1.default.Types.ObjectId(chatId),
        sender: { $ne: new mongoose_1.default.Types.ObjectId(user.id) },
        read: false
    }, {
        $set: { read: true },
    });
    // Transform each message to show the other participant's info
    const transformedMessages = messages.map((msg) => {
        const { files } = msg, rest = __rest(msg, ["files"]);
        return Object.assign(Object.assign({}, rest), { image: [...msg.image, ...msg.files], sender: msg.sender._id.toString() === user.id
                ? otherParticipant
                : msg.sender, isOwnMessage: msg.sender._id.toString() === user.id, ownerId: msg.sender._id });
    });
    return transformedMessages;
});
const replyMessageToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!payload.replyTo) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Reply To message ID is required");
        }
        if (!payload.text && (!payload.image || payload.image.length === 0)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Reply must contain text or image");
        }
        const parentMessage = yield message_model_1.Message.findById(payload.replyTo);
        if (!parentMessage) {
            if (payload.image)
                payload.image.forEach((img) => (0, unlinkFile_1.default)(img));
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Parent message not found");
        }
        // Fetch chat with populated participants
        const chat = yield chat_model_1.Chat.findById(parentMessage.chatId)
            .populate('participants', '_id name email image');
        if (!chat) {
            if (payload.image)
                payload.image.forEach((img) => (0, unlinkFile_1.default)(img));
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Chat not found");
        }
        const isParticipant = chat.participants.some((p) => { var _a; return p._id.toString() === ((_a = payload.sender) === null || _a === void 0 ? void 0 : _a.toString()); });
        if (!isParticipant) {
            if (payload.image)
                payload.image.forEach((img) => (0, unlinkFile_1.default)(img));
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not a participant of this chat");
        }
        // Create reply message
        const replyMessage = yield message_model_1.Message.create({
            chatId: parentMessage.chatId,
            replyTo: parentMessage._id,
            sender: payload.sender,
            text: payload.text,
            image: payload.image || [],
        });
        // Update parent message replies and chat in parallel
        const [populatedReplyMessage] = yield Promise.all([
            // Populate the reply message
            message_model_1.Message.findById(replyMessage._id)
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
            message_model_1.Message.findByIdAndUpdate(parentMessage._id, {
                $push: { replies: replyMessage._id }
            }),
            // Update chat last activity
            chat_model_1.Chat.findByIdAndUpdate(parentMessage.chatId, {
                lastText: payload.text || '',
                lastImage: payload.image || [],
            })
        ]);
        if (!populatedReplyMessage) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to populate reply message");
        }
        // SOCKET - Emit to all participants with populated data
        const io = global.io;
        if (io) {
            chat.participants.forEach((participant) => {
                var _a;
                const participantId = participant._id.toString();
                // Create message with isOwnMessage flag
                const messageForParticipant = Object.assign(Object.assign({}, populatedReplyMessage), { isOwnMessage: participantId === ((_a = payload.sender) === null || _a === void 0 ? void 0 : _a.toString()) });
                io.emit(`message::${participantId}`, messageForParticipant);
            });
        }
        // Return with isOwnMessage true for sender
        return Object.assign(Object.assign({}, populatedReplyMessage), { isOwnMessage: true });
    }
    catch (error) {
        if (payload.image)
            payload.image.forEach((img) => (0, unlinkFile_1.default)(img));
        throw error;
    }
});
const updateMessageToDB = (messageId, payload, user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const message = yield message_model_1.Message.findById(messageId);
        if (!message) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Message not found");
        }
        if (message.sender.toString() !== user.id) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not authorized to update this message");
        }
        const updatedMessage = yield message_model_1.Message.findByIdAndUpdate(messageId, payload, { new: true });
        if (!updatedMessage) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update message");
        }
        return updatedMessage;
    }
    catch (error) {
        throw error;
    }
});
const deleteMessageToDB = (messageId, user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const message = yield message_model_1.Message.findById(messageId);
        if (!message) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Message not found");
        }
        if (message.sender.toString() !== user.id) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not authorized to delete this message");
        }
        const deletedMessage = yield message_model_1.Message.findByIdAndUpdate(message._id, { isDeleted: true, text: "", image: [], files: [], replyTo: null }, { new: true });
        if (!deletedMessage) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete message");
        }
        return deletedMessage;
    }
    catch (error) {
        throw error;
    }
});
exports.MessageService = {
    sendMessageToDB,
    getMessageFromDB,
    replyMessageToDB,
    updateMessageToDB,
    deleteMessageToDB
};
