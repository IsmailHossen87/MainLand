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
exports.NotificationController = void 0;
const http_status_codes_1 = require("http-status-codes");
const notification_service_1 = require("./notification.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
// send admin notifications to the users accaunts
// CONTROLLER
const sendAdminNotification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId } = req.params;
        const user = req.user;
        const status = req.query.status;
        yield notification_service_1.NotificationService.sendAdminNotification(eventId, user, status);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Notification sent successfully",
        });
    }
    catch (error) {
        next(error);
    }
});
const getNotificationFromDB = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield notification_service_1.NotificationService.getNotificationFromDB(user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Notifications Retrieved Successfully',
        data: result.data,
    });
}));
const getUnreadNotificationCount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield notification_service_1.NotificationService.getUnreadNotificationCount(user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Unread Notification Count Retrieved Successfully',
        data: {
            notificationCount: result.notificationCount,
            messageCount: result.messageCount || 0,
        },
    });
}));
// const updateNotification = catchAsync(async (req: Request, res: Response) => {
//   const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';
//   const user = req?.user as JwtPayload;
//   const result = await NotificationService.updateNotification(
//     req.params.id,
//     user,
//     { ...req.body, isDraft }
//   );
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: isDraft
//       ? 'Notification updated successfully'
//       : 'Notification published successfully',
//     data: result,
//   });
// });
// GET ALL NOTIFICATION
// const getAllNotification = catchAsync(async (req: Request, res: Response) => {
//   const query = req.query
//   const user = req.user as JwtPayload
//   const result = await NotificationService.getAllNotifications(query as Record<string, string>, user)
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Notification Retrived successfully',
//     meta: result.meta,
//     data: result.data,
//   });
// })
// const getNotificationById = catchAsync(async (req: Request, res: Response) => {
//   const result = await NotificationService.getNotificationById(req.params.id);
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Notification fetched successfully',
//     data: result,
//   });
// });
// const deleteNotification = catchAsync(async (req: Request, res: Response) => {
//   const result = await NotificationService.deleteNotification(req.params.id);
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Notification deleted successfully',
//     data: result,
//   });
// });
// const getNotificationCount = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user;
//   const result = await NotificationService.getNotificationCount(user);
//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: 'Notification count fetched successfully',
//     data: result,
//   });
// });
exports.NotificationController = {
    sendAdminNotification,
    getNotificationFromDB,
    getUnreadNotificationCount,
    // getNotificationById,
    // updateNotification,
    // deleteNotification,
    // getNotificationCount,
    // getAllNotification
};
