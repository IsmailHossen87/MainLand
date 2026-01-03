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
    sellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },
    organizerPayout: {
        type: Number,
        default: 0,
    },
    payoutStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    },
    payoutDate: {
        type: Date,
    },
    stripeTransferId: {
        type: String,
    },
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Event",
        index: true,
    },
    organizerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
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
    paymentIntentId: {
        type: String,
        sparse: true,
        unique: true,
    },
    sellAmount: {
        type: Number,
    },
    earnedAmount: {
        type: Number,
    },
    payoutEligibleDate: {
        type: Date
    },
    purchaseQuantity: {
        type: Number,
        default: 0,
    },
    revenue: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.TransactionHistory = (0, mongoose_1.model)("transactionHistory", transactionHistorySchema);
