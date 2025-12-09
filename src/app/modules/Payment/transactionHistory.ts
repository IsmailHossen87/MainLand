import { Schema, model, Document, Types } from "mongoose";
import { TicketType } from "../ORGANIZER/Event/Event.interface";

export interface ITransactionHistory {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  ticketId: Types.ObjectId;
  resellerId: Types.ObjectId;
  type: 'directPurchase' | 'resellPurchase';
  ticketInfo: {
    ticketType: TicketType,
    quantity: number,
    ticketPrice: number,
    commission: number,
  }[];
  purchaseAmount: number;
  sellAmount: number;
  earnedAmount: number;
  mainLandFee: number;
  adminPercentageTotal: number;
  ticketQuantity: number;
}


const transactionHistorySchema = new Schema<ITransactionHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    resellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);



export const TransactionHistory = model<ITransactionHistory>(
  "transactionHistory",
  transactionHistorySchema
);