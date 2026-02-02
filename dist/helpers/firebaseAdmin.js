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
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveNotification = exports.sendFirebaseNotification = exports.firebaseNotificationBuilder = void 0;
const notification_model_1 = require("../app/modules/Notification/notification.model");
const firebase_1 = require("./firebase");
const firebaseNotificationBuilder = ({ user, title, message, data, }) => {
    const sound = user.isSoundNotificationEnabled ? "default" : undefined;
    const notification = (0, exports.sendFirebaseNotification)(user.fcmToken, title, message, sound, Object.assign({ isSoundNotificationEnabled: `${user.isSoundNotificationEnabled}`, isVibrationNotificationEnabled: `${user.isVibrationNotificationEnabled}` }, data));
    return notification;
};
exports.firebaseNotificationBuilder = firebaseNotificationBuilder;
const sendFirebaseNotification = (token, title, body, sound, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token)
        return;
    const notification = {
        token,
        data: data !== null && data !== void 0 ? data : {},
        android: {
            priority: "high",
        },
        apns: {
            headers: {
                "apns-push-type": "alert",
                "apns-priority": "10",
            },
            payload: {
                aps: Object.assign({ alert: {
                        title,
                        body,
                    } }, (sound && { sound })),
            },
        },
    };
    yield firebase_1.firebaseAdmin.messaging().send(notification);
});
exports.sendFirebaseNotification = sendFirebaseNotification;
const saveNotification = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findOneAndUpdate({ eventId: data.eventId }, { $set: data }, {
        new: true,
        upsert: true,
    });
    return notification;
});
exports.saveNotification = saveNotification;
