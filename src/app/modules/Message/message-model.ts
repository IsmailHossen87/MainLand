import { Schema, model } from 'mongoose';
import { IMessage, MessageModel } from './message-interface';

const messageSchema = new Schema<IMessage>(
    {
        chatId: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
        },

        replyTo: {
            type: Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },

        replies: [{
            type: Schema.Types.ObjectId,
            ref: "Message",
        }],

        read: {
            type: Boolean,
            default: false,
        },

        sender: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },

        text: {
            type: String,
            trim: true,
        },

        image: [{
            type: String,
            default: null,
        }],

        isDeleted: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

export const Message = model<IMessage, MessageModel>("Message", messageSchema);