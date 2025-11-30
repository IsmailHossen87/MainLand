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
    title: { type: String, default: "", required: true, trim: true },
  },
  { timestamps: true, versionKey: false }
);

// 🟦 Category Schema
const CategorySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    title: {
      type: String, default: "",
      trim: true,
    },
    coverImage: {
      type: String, default: "",
    },
  },
  { timestamps: true, versionKey: false }
);

// 🟩 Event Schema
const EventSchema = new Schema<IEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventName: { type: String, required: true, default: "", trim: true },
    image: { type: String, default: "" },

    category: [
      {
        categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: false },
        subCategory: [{ type: Schema.Types.ObjectId, ref: "SubCategory" }],
      },
    ],

    tags: [{ type: String, default: "", trim: true }],
    description: { type: String, default: "" },

    eventDate: { type: Date, default: null },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },

    streetAddress: { type: String, default: "" },
    streetAddress2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },

    EventStatus: { type: String, enum: Object.values(IEventStatus), default: IEventStatus.Draft },
    notification: { type: String, default: "" },
    notificationStatus: { type: String, enum: ["idle", "pending", "success", "rejected"], default: "idle" },

    eventCode: { type: String, default: "" },
    tickets: [
      {
        type: {
          type: String,
          enum: Object.values(TicketType),
          required: true,
          default: TicketType.OTHER,
        },
        price: { type: Number, required: true },
        availableUnits: { type: Number, required: true },
        outstandingUnits: { type: Number },
        earnedAmount: { type: Number, default: 0 },
        ticketBuyerId: [{ type: Schema.Types.ObjectId, ref: "TicketPurchase" }],
      },
    ],

    ticketSaleStart: { type: Date, default: null },
    preSaleStart: { type: Date, default: null },
    preSaleEnd: { type: Date, default: null },
    isFreeEvent: { type: Boolean, default: false },
    discountCodes: [
      {
        code: { type: String, default: "", trim: true },
        percentage: { type: Number, min: 0, max: 100 },
        expireDate: { type: Date }
      },
    ],

    organizerName: { type: String, default: "" },
    organizerEmail: { type: String, default: "" },
    organizerPhone: { type: String, default: "" },

    locationName: { type: String, default: "" },
    totalEarned: { type: Number, default: 0 },
    totalReview: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    isDraft: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


// 🧩 Export Models
export const SubCategory = model('SubCategory', SubCategorySchema);
export const Category = model('Category', CategorySchema);
export const Event = model('Event', EventSchema);
