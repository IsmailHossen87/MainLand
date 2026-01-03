"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    message: {
        type: String,
        required: true,
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    eventTitle: {
        type: String,
        required: true,
    },
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Event",
    },
    read: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        title: {
            enum: ["EVENT", "NOTIFICATION", 'SELL_TICKET'],
            default: "NOTIFICATION",
        },
        isDraft: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["success", "rejected"],
            default: "",
        },
    },
}, { timestamps: true, versionKey: false });
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
