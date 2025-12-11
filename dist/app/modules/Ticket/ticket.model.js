"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketPurchase = void 0;
const mongoose_1 = require("mongoose");
const ticket_interface_1 = require("./ticket.interface");
// ===============================
// Attendee Information Schema
// ===============================
const AttendeeInformationSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
}, { _id: false, versionKey: false });
// ===============================
// Ticket Purchase Schema
// ===============================
const TicketPurchaseSchema = new mongoose_1.Schema({
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    ownerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    sellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    resellerId: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    ticketName: {
        type: String,
        required: true,
        trim: true,
        unique: true, // ❗ If generated automatically, keep it unique.
    },
    attendeeInformation: {
        type: AttendeeInformationSchema,
        required: true,
    },
    ticketType: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(ticket_interface_1.ITicketStatus),
        default: ticket_interface_1.ITicketStatus.available,
    },
    mainLandFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountCode: {
        type: String,
        default: "",
        trim: true,
    },
    purchaseAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    sellAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true, versionKey: false });
// ===============================
// Model Export
// ===============================
exports.TicketPurchase = (0, mongoose_1.model)("TicketPurchase", TicketPurchaseSchema);
