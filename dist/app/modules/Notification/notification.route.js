"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRoutes = void 0;
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const router = (0, express_1.Router)();
router.patch('/send-notification/:eventId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), notification_controller_1.NotificationController.sendAdminNotification);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER), notification_controller_1.NotificationController.getNotificationFromDB);
router.get('/unread-count', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER), notification_controller_1.NotificationController.getUnreadNotificationCount);
// router.get('/all-notification', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), NotificationController.getAllNotification);
// //single Notification,getNotification,updateNotification
// router
//   .route('/:id')
//   .get(auth(USER_ROLES.ADMIN), NotificationController.getNotificationById)
//   .patch(auth(USER_ROLES.ADMIN), dynamicNotifaicationValidation, NotificationController.updateNotification)
//   .delete(auth(USER_ROLES.ADMIN), NotificationController.deleteNotification);
exports.NotificationRoutes = router;
