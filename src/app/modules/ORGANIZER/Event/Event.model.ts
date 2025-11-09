import { User } from './../../user/user.model';
import { Schema, model, Types } from 'mongoose';

interface IEventDoc extends Document {
  userId: Types.ObjectId;
  eventName: String;
}

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
  {
    timestamps: true,
    versionKey: false,
  }
);

// 🟩 Event Schema
const EventSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventName: {type: String, trim: true,},
    title: {type: String,trim: true},
    image: {type: String,},
    category: [
      {
        type: Types.ObjectId,
        ref: 'Category',
      },
    ],
    location: { type: String, },
    totalEarned: {type: Number,default: 0,},
    startTime: {type: Date, },
    endTime: {type: Date},
    address: {
      type: String,
    },
    totalReview: [
      {
        type: Types.ObjectId,
        ref: 'Review',
      },
    ],
    isDraft: {type: Boolean,default: true},

    statusEnded: { type: String,enum: ['Ongoing', 'Ended', 'Cancelled'], default: 'Ongoing'},
    description: {type: String},
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
export const Category = model('Category', CategorySchema);
export const Event = model('Event', EventSchema);
