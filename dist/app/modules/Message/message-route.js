"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const fileUploadHandler_1 = __importDefault(require("../../middlewares/fileUploadHandler"));
const message_controller_1 = require("./message-controller");
const ParseMultipleFileData_1 = require("../../middlewares/ParseMultipleFileData");
const router = (0, express_1.Router)();
router.post("/", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), (0, fileUploadHandler_1.default)(), message_controller_1.messageController.sendMessage);
router.post('/reply/:messageId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.ADMIN), (0, fileUploadHandler_1.default)(), (0, ParseMultipleFileData_1.parseMultipleFilesdata)('image'), message_controller_1.messageController.replyMessage);
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.ADMIN), message_controller_1.messageController.getMessage);
router.patch("/update-message/:id", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), (0, fileUploadHandler_1.default)(), message_controller_1.messageController.updateMessage);
router.delete("/delete-message/:id", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), message_controller_1.messageController.deleteMessage);
exports.MessageRouter = router;
