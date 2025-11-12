import { Schema, model, Types } from "mongoose";
import { IAttendInformation, ITicketRequest,  } from "./Purchase.Interface";

export interface ITicketPurchase {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  attenInformation: IAttendInformation;
  tickets: {
    ticketType: ITicketRequest;
  }[];
  mailLandFee: number;
  totalAmount: number;
  discount: number;
}

// Schema for attendee info
const AttendInformationSchema = new Schema<IAttendInformation>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false,versionKey:false }
);

const TicketRequestSchema = new Schema<ITicketRequest>(
  {
    ticketType: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false, versionKey: false }
);


// Main Ticket Purchase Schema
const TicketPurchaseSchema = new Schema<ITicketPurchase>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attenInformation: {
      type: AttendInformationSchema,
      required: true,
    },
     tickets: {
      type: [TicketRequestSchema],
      required: true,
    },
    mailLandFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
  },
  {
    timestamps: true,versionKey:false
  }
);

export const TicketPurchase = model<ITicketPurchase>(
  "TicketPurchase",
  TicketPurchaseSchema
);
