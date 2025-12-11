"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    chatId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Chat",
    },
    replyTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
    replies: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Message",
        }],
    read: {
        type: Boolean,
        default: false,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    files: [{
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
}, {
    timestamps: true,
});
exports.Message = (0, mongoose_1.model)("Message", messageSchema);
