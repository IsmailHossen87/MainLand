import { Schema, model, Document, Types } from "mongoose";

export interface ITransactionHistory {
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  ticketId: Types.ObjectId;
  purchaseAmount: number;
  sellAmount: number;
  earnedAmount: number;
}


const transactionHistorySchema = new Schema<ITransactionHistory>(
  {
    userId: {
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
    purchaseAmount: {
      type: Number,
    },
    sellAmount: {
      type: Number,
    },
    earnedAmount: {
      type: Number,
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