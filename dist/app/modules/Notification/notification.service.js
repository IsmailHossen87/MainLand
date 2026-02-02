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
exports.NotificationService = void 0;
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const Event_model_1 = require("../ORGANIZER/Event/Event.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const user_model_1 = require("../user/user.model");
const notificatio_helper_1 = require("../../../helpers/notificatio-helper");
const user_1 = require("../../../enums/user");
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const notification_model_1 = require("./notification.model");
const constrant_1 = require("../../../shared/constrant");
const message_model_1 = require("../Message/message-model");
/* **************************************
     ADMIN SEND NOTIFICATION TO ORGANIZER
*****************************************/
const sendAdminNotification = (eventId, user, status) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (user_1.USER_ROLES.ADMIN !== user.role) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You are not permitted for this API");
    }
    if (!eventId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Event ID is required");
    }
    const event = yield Event_model_1.Event.findById(eventId);
    if (!event) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Event not found");
    }
    const organizerId = (_a = event.userId) === null || _a === void 0 ? void 0 : _a.toString();
    if (!organizerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Organizer not found in event");
    }
    const organizer = yield user_model_1.User.findById(organizerId);
    if (!organizer) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Organizer user not found");
    }
    if (!event.notification) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No notification message found on event");
    }
    const title = status === "rejected"
        ? "Your notification broadcast has been rejected"
        : "Your notification has been successfully broadcast";
    const message = event.notification;
    const notificationData = {
        title,
        message,
        receiver: new mongoose_1.default.Types.ObjectId(organizerId),
        type: "NOTIFICATION",
        read: false,
        eventId: event._id,
        eventTitle: event.eventName,
        status,
    };
    // 🔥 Clear event notification if rejected
    if (status === "rejected") {
        event.notification = "";
        event.notificationStatus = "idle";
        yield event.save();
    }
    yield (0, notificatio_helper_1.sendNotifications)(notificationData, "notification");
    // 🔥 Firebase Push Notification
    if (organizer === null || organizer === void 0 ? void 0 : organizer.fcmToken) {
        // await sendFirebaseNotification(
        //   organizer.fcmToken,
        //   title,
        //   message,
        //   {
        //     type: "NOTIFICATION",
        //     eventId: event._id.toString(),
        //     status,
        //   }
        // );
    }
    return true;
});
/* **************************************
     GET NOTIFICATIONS WITH META + UNREAD
*****************************************/
const getNotificationFromDB = (user, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(user === null || user === void 0 ? void 0 : user.id)) {
        throw new Error("User ID is required");
    }
    // Base query
    const baseQuery = notification_model_1.Notification.find({ receiver: user.id })
        .sort({ createdAt: -1 }).select('-status');
    // Query builder initialize
    const qb = new QueryBuilder_1.QueryBuilder(baseQuery, query);
    qb.search(constrant_1.excludeField)
        .filter()
        .dateRange()
        .sort()
        .paginate()
        .fields();
    yield notification_model_1.Notification.updateMany({ receiver: user.id }, { read: true });
    // Build & meta should come from qb (not result of build)
    const dataPromise = qb.build();
    const metaPromise = qb.getMeta();
    const [data, meta] = yield Promise.all([dataPromise, metaPromise]);
    return { data, meta };
});
const getUnreadNotificationCount = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(user === null || user === void 0 ? void 0 : user.id)) {
        throw new Error("User ID is required");
    }
    const count = yield notification_model_1.Notification.countDocuments({ receiver: user.id, read: false });
    const messageCount = yield message_model_1.Message.countDocuments({ sender: { $ne: user.id }, read: false });
    return { notificationCount: count, messageCount: messageCount, };
});
exports.NotificationService = {
    sendAdminNotification,
    getNotificationFromDB,
    getUnreadNotificationCount,
};
