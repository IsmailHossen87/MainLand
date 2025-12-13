"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const chat_controller_1 = require("./chat.controller");
const chat_validation_1 = require("./chat.validation");
const router = express_1.default.Router();
router.post('/:otherUserId', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), (0, validateRequest_1.default)(chat_validation_1.createOneToOneChatValidation), chat_controller_1.ChatController.createOneToOneChat);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), chat_controller_1.ChatController.getAllChatList);
// Report
router.post('/report/:chatId', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), chat_controller_1.ChatController.createReport);
router.get('/reports', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), chat_controller_1.ChatController.getAllReports);
// Get Reports By User
router.get('/reports/:userId', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN), chat_controller_1.ChatController.getReportsByUser);
exports.ChatRoutes = router;
