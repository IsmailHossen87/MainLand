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
exports.sendNotifications = void 0;
const notification_model_1 = require("../app/modules/Notification/notification.model");
const sendNotifications = (data, chanelType) => __awaiter(void 0, void 0, void 0, function* () {
    let notification;
    if (data.eventId) {
        notification = yield notification_model_1.Notification.findOneAndUpdate({ eventId: data.eventId }, { $set: data }, {
            new: true,
            upsert: true,
        });
    }
    else {
        notification = yield notification_model_1.Notification.create(data);
    }
    console.log(data, chanelType);
    // @ts-ignore
    const socketIo = global.io;
    if (socketIo) {
        const channel = chanelType === "notification" ? `notification::${data.receiver}` : `message::${data.receiver}`;
        socketIo.emit(channel, data);
    }
    return notification;
});
exports.sendNotifications = sendNotifications;
