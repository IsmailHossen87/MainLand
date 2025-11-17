import { Schema, model, Types } from 'mongoose';
import {
  IAttendInformation,
  IResellTicket,
  ISecondaryTicketPurchase,
  ITicketPurchase,
  ITicketRequest,
} from './Purchase.Interface';

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
        ref: 'User',
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

  { timestamps: true, versionKey: false }
);

export const TicketPurchase = model<ITicketPurchase>(
  'TicketPurchase',
  TicketPurchaseSchema
);

// -------------------------------------------------REE_Sell
// ============================================
// RESELL TICKET MODEL
// ============================================

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
      enum: ['available', 'NotAvailable'],
      default: 'available',
    },
    secondaryBuyer: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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
// ResellTicketSchema.pre('findOneAndUpdate', async function (next) {
//   const query: any = this.getQuery();
//   const update: any = this.getUpdate();

//   const doc = await ResellTicket.findById(query._id);
//   if (!doc) return next();

//   const decreaseBy = update.$inc?.quantity ?? 0; 
//   const finalQuantity = doc.quantity + decreaseBy;

//   // If zero or negative → mark as NotAvailable
//   if (finalQuantity <= 0) {
//     this.setUpdate({
//       ...update,
//       $set: {
//         ...(update.$set || {}),
//         quantity: 0,
//         status: 'NotAvailable',
//       },
//     });
//   }

//   next();
// });



export const ResellTicket = model<IResellTicket>(
  'ResellTicket',
  ResellTicketSchema
);

// Schema
const secondaryTicketPurchaseSchema = new Schema<ISecondaryTicketPurchase>(
  {
    originalTicketId: {
      type: Schema.Types.ObjectId,
      ref: 'TicketPurchase',
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    personalInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phoneNumber: { type: String, required: true },
    },
    resellPrice: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Model
export const SecondaryTicketPurchase = model<ISecondaryTicketPurchase>(
  'SecondaryTicketPurchase',
  secondaryTicketPurchaseSchema
);
