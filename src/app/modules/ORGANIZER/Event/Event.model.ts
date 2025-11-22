import { User } from './../../user/user.model';
import { Schema, model, Types } from 'mongoose';
import { IEvent, IEventStatus, ISubcategory, TicketType } from './Event.interface';

interface IEventDoc extends Document {
  userId: Types.ObjectId;
  eventName: String;
}

const SubCategorySchema = new Schema<ISubcategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    title: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false }
);

// 🟦 Category Schema
const CategorySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    title: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false }
);

// 🟩 Event Schema
const EventSchema = new Schema<IEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventName: { type: String, trim: true, required: true },
    title: { type: String, trim: true },
    image: { type: String },
   category: [
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: [
      {
        type: Schema.Types.ObjectId,
        ref: "SubCategory",
      }
    ]
  }
],
    tags: [{ type: String, trim: true }],

    // 🗓️ Event Schedule
    eventDate: { type: Date },
    startTime: { type: String },
    endTime: { type: String },

    // 📍 Location Details
    address: { type: String },
    streetAddress: { type: String },
    streetAddress2: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    EventStatus: { type: String, enum: Object.values(IEventStatus), default: IEventStatus.UnderReview},
    // 🎟️ Tickets Details
    tickets: [
      {
        type: {
          type: String,
          enum: Object.values(TicketType),
          required: true,
        },
        price: { type: Number, required: true },
        availableUnits: { type: Number, required: true },
        ticketBuyerId: [{ type: Schema.Types.ObjectId, ref: 'TicketPurchase' }],
      },
    ],

    // 🕒 Sale Details
    ticketSaleStart: { type: Date },
    ticketSaleEnd: { type: Date },
    preSaleStart: { type: Date },
    preSaleEnd: { type: Date },

    // 💸 Discount Codes
    discountCodes: [
      {
        code: { type: String, trim: true },
        percentage: { type: Number, min: 0, max: 100 },
      },
    ],

    // 👤 Organizer Details
    organizerName: { type: String },
    organizerType: { type: String },
    organizerEmail: { type: String },
    organizerPhone: { type: String },

    // 📊 Other Info
    locationName: { type: String },
    totalEarned: { type: Number, default: 0 },
    totalReview: [
      {
        type: Types.ObjectId,
        ref: 'Review',
      },
    ],
    isDraft: { type: Boolean, default: true },
    // status: {
    //   type: String,
    //   enum: ['Pending', 'Accepted', 'Rejected'],
    //   default: 'Pending',
    // },
    description: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

EventSchema.pre('save', async function (next) {
  const event = this as unknown as IEventDoc;
  const Model = this.constructor as typeof Event;

  const existingEvent = await Model.findOne({
    userId: event.userId,
    eventName: event.eventName,
  });

  if (existingEvent) {
    return next(
      new Error(`You already have an event with this ${this.eventName}`)
    );
  }

  next();
});
// 🧩 Export Models
export const SubCategory = model('SubCategory', SubCategorySchema);
export const Category = model('Category', CategorySchema);
export const Event = model('Event', EventSchema);
