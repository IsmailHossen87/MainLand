import { Schema, model, Document, Types } from "mongoose";

export interface ITransactionHistory {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  ticketId: Types.ObjectId;
  resellerId: Types.ObjectId;
  type: 'directPurchase' | 'resellPurchase' | 'adminPercentage';
  purchaseAmount: number;
  sellAmount: number;
  earnedAmount: number;
  mainLandFee: number;
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
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "TicketPurchase",
      index: true,
    },
    mainLandFee: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ['directPurchase', 'resellPurchase', 'adminPercentage'],
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