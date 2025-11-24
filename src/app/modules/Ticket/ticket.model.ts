import { model, Schema } from "mongoose";
import { IAttendeeInformation, ITicketPurchase, ITicketStatus } from "./ticket.interface";


const AttendInformationSchema = new Schema<IAttendeeInformation>(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
    },
    { _id: false, versionKey: false }
);

const TicketPurchaseSchema = new Schema<ITicketPurchase>(
    {
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        ticketName: {
            type: String,
            required: true,
            unique: true,
        },

        attendeeInformation: {
            type: AttendInformationSchema,
            required: true,
        },

        ticketType: { type: String, required: true },
        status: {
            type: String,
            enum: Object.values(ITicketStatus),
            default: ITicketStatus.available,
        },

        mainLandFee: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        discountCode: { type: String, default: "" },
        purchaseAmount: { type: Number, required: true },
        sellAmount: { type: Number, default: 0 },
        totalEarned: { type: Number, default: 0 },

    },
    { timestamps: true, versionKey: false }
);


export const TicketPurchase = model<ITicketPurchase>(
    'TicketPurchase',
    TicketPurchaseSchema
);