import { model, Schema } from "mongoose";
import {
    IAttendeeInformation,
    ITicketPurchase,
    ITicketStatus,
} from "./ticket.interface";

// ===============================
// Attendee Information Schema
// ===============================
const AttendeeInformationSchema = new Schema<IAttendeeInformation>(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true },
        phone: { type: String, required: true },
    },
    { _id: false, versionKey: false }
);

// ===============================
// Ticket Purchase Schema
// ===============================
const TicketPurchaseSchema = new Schema<ITicketPurchase>(
    {
        eventId: {
            type: Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },

        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        sellerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        resellerId: [
            {
                type: Schema.Types.ObjectId,
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
            enum: Object.values(ITicketStatus),
            default: ITicketStatus.available,
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
    },
    { timestamps: true, versionKey: false }
);

// ===============================
// Model Export
// ===============================
export const TicketPurchase = model<ITicketPurchase>(
    "TicketPurchase",
    TicketPurchaseSchema
);
