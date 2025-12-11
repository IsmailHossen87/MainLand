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
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const getFilePath_1 = require("../../../shared/getFilePath");
// const sendMessage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const user = req?.user as JwtPayload;
//     // Handle multiple images (array)
//     let images: string[] = [];
//     if (req.files && "image" in req.files) {
//         // Check if it's an array of files
//         const fileArray = req.files.image as Express.Multer.File[];
//         images = fileArray.map(file => `/image/${file.filename}`);
//     }
//     // Parse data if it's a string (when sent with multipart/form-data)
//     let bodyData: any = req.body;
//     if (req.body.data && typeof req.body.data === "string") {
//         try {
//             bodyData = JSON.parse(req.body.data);
//         } catch (err) {
//             throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid JSON in data field");
//         }
//     }
//     const payload = {
//         ...bodyData,
//         image: images,
//         sender: user.id,
//     };
//     console.log("Payload after parsing:", payload);
//     const result = await MessageService.sendMessageToDB(payload);
//     sendResponse(res, {
//         statusCode: StatusCodes.OK,
//         success: true,
//         message: "Message sent successfully",
//         data: result
//     });
// });
const sendMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const image = (0, getFilePath_1.getMultipleFilesPath)(req.files, 'image');
    const document = (0, getFilePath_1.getMultipleFilesPath)(req.files, 'document');
    const user = req.user;
    const payload = Object.assign(Object.assign({}, req.body), { image, files: document, sender: user.id });
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
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid JSON in data field");
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
exports.messageController = {
    sendMessage,
    getMessage,
    replyMessage,
};
