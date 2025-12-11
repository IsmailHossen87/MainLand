"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionHistory = void 0;
const mongoose_1 = require("mongoose");
const transactionHistorySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },
    resellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Event",
        index: true,
    },
    ticketInfo: [{
            ticketType: { type: String, },
            quantity: { type: Number, default: 0 },
            commission: { type: Number, default: 0 },
            ticketPrice: { type: Number, default: 0 }
        },],
    ticketId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "TicketPurchase",
        index: true,
    },
    mainLandFee: {
        type: Number,
        default: 0,
    },
    adminPercentageTotal: {
        type: Number,
        default: 0,
    },
    type: {
        type: String,
        enum: ['directPurchase', 'resellPurchase'],
        default: 'directPurchase',
    },
    purchaseAmount: {
        type: Number,
    },
    sellAmount: {
        type: Number,
    },
    earnedAmount: {
        type: Number,
    },
    ticketQuantity: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.TransactionHistory = (0, mongoose_1.model)("transactionHistory", transactionHistorySchema);
