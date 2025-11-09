import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { User } from '../../user/user.model';
import { Category, Event } from './Event.model';
import { USER_ROLES } from '../../../../enums/user';
import { IEvent } from './Event.interface';

const creteCategory = async (payload: JwtPayload) => {
  const isExistUser = await User.findById(payload.userId);
  if (!isExistUser || isExistUser.role != 'ADMIN') {
    throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
  }
  const createCategory = await Category.create(payload);
  return createCategory;
};

// 1️⃣ Create Event (Draft or Full)
const createEvent = async (payload: any) => {
  const { userId, eventName, isDraft } = payload;
  const isExistUser = await User.findById(userId);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
  }
  if (isExistUser.role !== USER_ROLES.ORGANIZER) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only organizer can create Event'
    );
  }
  // Category validation
  if (payload.category && payload.category.length > 0) {
    const categories = await Category.find({ _id: { $in: payload.category } });
    if (categories.length !== payload.category.length) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'One or more categories do not exist!'
      );
    }
  }

  // ⭐ যদি draft হয়, eventName দিয়ে check করবে
  if (isDraft) {
    let event = await Event.findOne({ userId, eventName, isDraft: true });

    if (event) {
      // Update existing draft
      event = await Event.findByIdAndUpdate(
        event._id,
        { $set: payload },
        { new: true, runValidators: false }
      );
      return event;
    }
  }

  const event = await Event.create(payload);
  return event;
};


// 2️⃣ Update Event
const updateEvent = async (eventId: string, userId: string, payload: any) => {
  const { isDraft } = payload;

  // Event খুঁজুন
  const event = await Event.findOne({ _id: eventId, userId });

  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
  }

  // Category validation
  if (payload.category && payload.category.length > 0) {
    const categories = await Category.find({ _id: { $in: payload.category } });
    if (categories.length !== payload.category.length) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'One or more categories do not exist!'
      );
    }
  }
  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { $set: payload },
    {
      new: true,
    }
  );

  return updatedEvent;
};

export const EventService = {
  createEvent,
  updateEvent,
  creteCategory,
};
