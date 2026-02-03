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
exports.messageController = void 0;
const http_status_codes_1 = require("http-status-codes");
const MessageService_1 = require("./MessageService");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const getFilePath_1 = require("../../../shared/getFilePath");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const sendMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const imageFiles = (0, getFilePath_1.getMultipleFilesPath)(req.files, 'image');
    const documentFiles = (0, getFilePath_1.getMultipleFilesPath)(req.files, 'document');
    const user = req.user;
    const payload = Object.assign(Object.assign({}, JSON.parse(req.body.data)), { image: imageFiles && (imageFiles === null || imageFiles === void 0 ? void 0 : imageFiles.length) > 0 ? imageFiles : [], files: documentFiles && (documentFiles === null || documentFiles === void 0 ? void 0 : documentFiles.length) > 0 ? documentFiles : [], sender: user.id });
    const result = yield MessageService_1.MessageService.sendMessageToDB(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Message sent successfully",
        data: result
    });
}));
const getMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const messages = yield MessageService_1.MessageService.getMessageFromDB(id, req.user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message Retrieved Successfully',
        data: messages,
    });
}));
const replyMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req === null || req === void 0 ? void 0 : req.user;
    // Fixed: Changed from "images" to "image" to match sendMessage
    let images = [];
    if (req.files && "image" in req.files) {
        const fileArray = req.files.image;
        images = fileArray.map(file => `/image/${file.filename}`);
    }
    // Parse data if it's a string
    let bodyData = req.body;
    if (req.body.data && typeof req.body.data === "string") {
        try {
            bodyData = JSON.parse(req.body.data);
        }
        catch (err) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid JSON in data field");
        }
    }
    const payload = Object.assign(Object.assign({}, bodyData), { replyTo: req.params.messageId, image: images, sender: user.id });
    const message = yield MessageService_1.MessageService.replyMessageToDB(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Reply message sent successfully',
        data: message,
    });
}));
const updateMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messageId = req.params.id;
    const user = req.user;
    const payload = req.body;
    const result = yield MessageService_1.MessageService.updateMessageToDB(messageId, payload, user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message updated successfully',
        data: result,
    });
}));
const deleteMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messageId = req.params.id;
    const user = req.user;
    const result = yield MessageService_1.MessageService.deleteMessageToDB(messageId, user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message deleted successfully',
        data: result,
    });
}));
exports.messageController = {
    sendMessage,
    getMessage,
    replyMessage,
    updateMessage,
    deleteMessage
};
