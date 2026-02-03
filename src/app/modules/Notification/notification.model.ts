import { Schema, model, Types } from "mongoose";
import { INotification } from "./notification.interface";


const notificationSchema = new Schema<INotification>(
    {
        message: {
            type: String,
            required: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        eventTitle: {
            type: String,
        },
        eventStatus: {
            type: String,
        },
        eventId: {
            type: Schema.Types.ObjectId,
            ref: "Event",
        },
        read: {
            type: Boolean,
            default: false,
        },
        title: {
            type: String,
        },
        type: {
            type: String,
            title: {
                enum: ["EVENT", "NOTIFICATION", 'SELL_TICKET', 'MESSAGE', 'WITHDRAW_TICKET'],
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
    },
    { timestamps: true, versionKey: false }
);

export const Notification = model<INotification>(
    "Notification",
    notificationSchema
);
