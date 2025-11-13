import { Schema, model, Types } from 'mongoose';
import { IAttendInformation, ITicketRequest } from './Purchase.Interface';

export interface ITicketPurchase {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  reeSellerUserId: Types.ObjectId[];
  attenInformation: IAttendInformation;
  tickets: {
    ticketType: ITicketRequest;
    quantity:number;
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
  { _id: false, versionKey: false }
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
      ref: 'Event',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reeSellerUserId: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
    ],
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
    timestamps: true,
    versionKey: false,
  }
);

export const TicketPurchase = model<ITicketPurchase>(
  'TicketPurchase',
  TicketPurchaseSchema
);

// -------------------------------------------------REE_Sell
// ============================================
// RESELL TICKET MODEL
// ============================================

export interface IResellTicket {
  originalTicketId: Types.ObjectId; 
  sellerId: Types.ObjectId; 
  eventId: Types.ObjectId;
  ticketType: string; 
  quantity: number;
  originalPrice: number;
  resellPrice: number;
  status: 'available' | 'sold' | 'cancelled';
  soldTo?: Types.ObjectId; // Buyer user ID (jodi bikri hoy)
  soldAt?: Date;
}

const ResellTicketSchema = new Schema<IResellTicket>(
  {
    originalTicketId: {
      type: Schema.Types.ObjectId,
      ref: 'TicketPurchase',
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    ticketType: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    originalPrice: { type: Number, required: true },
    resellPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['available', 'sold', 'cancelled'],
      default: 'available',
    },
    soldTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    soldAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ResellTicket = model<IResellTicket>(
  'ResellTicket',
  ResellTicketSchema
);
