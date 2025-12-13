"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = exports.Chat = void 0;
const mongoose_1 = require("mongoose");
const chatSchema = new mongoose_1.Schema({
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    status: {
        type: Boolean,
        default: true,
    },
    lastText: {
        type: String,
        default: '',
    },
    lastImage: [{
            type: String,
            default: '',
        }],
    isReported: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.Chat = (0, mongoose_1.model)('Chat', chatSchema);
const reportSchema = new mongoose_1.Schema({
    reporterUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    reportedUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    chatId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Chat',
    },
    Privacy_concerns: {
        type: Boolean,
        default: false,
    },
    Others: {
        type: String,
        default: '',
    },
    Obscene: {
        type: Boolean,
        default: false,
    },
    Defamation: {
        type: Boolean,
        default: false,
    },
    Copyright_violations: {
        type: Boolean,
        default: false,
    },
    Erotic_content: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.Report = (0, mongoose_1.model)('Report', reportSchema);
