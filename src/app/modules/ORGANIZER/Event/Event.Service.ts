import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { User } from '../../user/user.model';
import { Category, Event, SubCategory } from './Event.model';
import { USER_ROLES } from '../../../../enums/user';
import { QueryBuilder } from '../../../builder/QueryBuilder';
import { excludeField } from '../../../../shared/constrant';
import mongoose, { Types } from 'mongoose';
import { CreateEventPayload, IEventStatus, UpdateEventPayload } from './Event.interface';
export interface EventTicket {
  type: string;
  price: number;
  availableUnits: number;
}

const creteSubCategory = async (payload: JwtPayload) => {
  const isExistUser = await User.findById(payload.userId);
  if (!isExistUser || isExistUser.role != 'ADMIN') {
    throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
  }
  const createCategory = await SubCategory.create(payload);
  return createCategory;
};

const creteCategory = async (payload: JwtPayload) => {
  const isExistUser = await User.findById(payload.userId);
  if (!isExistUser || isExistUser.role != 'ADMIN') {
    throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
  }
  const createCategory = await Category.create(payload);
  return createCategory;
};
// UPDATEcategory
const updateCategory = async (categoryId: string, updateData: any) => {
  const category = await Category.findByIdAndUpdate(
    categoryId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
  }

  return category;
};
// UPDATEcategory
const updateSubCategory = async (categoryId: string, updateData: any) => {
  const category = await SubCategory.findByIdAndUpdate(
    categoryId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, "SubCategory not found");
  }

  return category;
};
// UPDATEcategory
const deleteCategory = async (id: string, type: string) => {
  if (type !== 'category' && type !== 'subCategory') {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid type");
  }
  if (type === 'category') {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
    }
    return category;
  }
  if (type === 'subCategory') {
    const subCategory = await SubCategory.findByIdAndDelete(id);
    if (!subCategory) {
      throw new ApiError(StatusCodes.NOT_FOUND, "SubCategory not found");
    }
    return subCategory;
  }

  return subCategory;
};


// CREATE EVENT
const createEvent = async (payload: any) => {
  const { userId, eventName, isDraft } = payload;

  // Check user exist
  const isExistUser = await User.findById(userId);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
  }

  if (
    isExistUser.role !== USER_ROLES.ORGANIZER &&
    isExistUser.role !== USER_ROLES.USER
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only organizer and User can create Event"
    );
  }

  // Category validation
  if (payload.category?.length) {
    const categoryIds = payload.category.map((c: any) => c.categoryId);
    const categories = await Category.find({ _id: { $in: categoryIds } });

    if (categories.length !== payload.category.length) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "One or more categories do not exist!"
      );
    }

    payload.category = payload.category.map((c: any) => ({
      categoryId: c.categoryId,
      subCategory: c.subCategory,
    }));
  }

  // If Event is a draft and already exists → update instead of creating new
  if (isDraft) {
    let event = await Event.findOne({ userId, eventName, isDraft: true });
    if (event) {
      // Auto-set outstandingUnits
      if (payload.tickets?.length) {
        payload.tickets = payload.tickets.map((t: any) => ({
          ...t,
          outstandingUnits: t.availableUnits,
        }));
      }

      event = await Event.findByIdAndUpdate(
        event._id,
        { $set: payload },
        { new: true, runValidators: true }
      );

      return event;
    }
  }

  // New Event → Set EventStatus
  payload.EventStatus = isDraft ? "Draft" : "UnderReview";

  // Auto-set outstandingUnits for new event
  if (payload.tickets?.length) {
    payload.tickets = payload.tickets.map((t: any) => ({
      ...t,
      outstandingUnits: t.availableUnits,
    }));
  }

  const event = await Event.create(payload);
  return event;
};



// UPDATE EVENT
const updateEvent = async (eventId: string, userId: string, payload: any) => {
  // Check event exists
  const event = await Event.findOne({ _id: eventId, userId });
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Event not found");
  }

  // Category validation
  if (payload.category?.length) {
    const categoryIds = payload.category.map((c: any) => c.categoryId);
    const categories = await Category.find({ _id: { $in: categoryIds } });

    if (categories.length !== payload.category.length) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "One or more categories do not exist!"
      );
    }
  }

  // Update EventStatus based on isDraft
  if ("isDraft" in payload) {
    payload.EventStatus = payload.isDraft ? "Draft" : "UnderReview";
  }

  // Auto-set outstandingUnits
  if (payload.tickets?.length) {
    payload.tickets = payload.tickets.map((t: any) => ({
      ...t,
      outstandingUnits: t.availableUnits,
    }));
  }

  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { $set: payload },
    { new: true, runValidators: true }
  );

  return updatedEvent;
};

// Live
const allLiveEvent = async () => {
  const allEvents = await Event.find({ EventStatus: 'Live' });
  if (!allEvents) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event is not Available');
  }
  return allEvents;
};


// Single Event ✅✅✅✅
const singleEvent = async (userID: string, eventId: string) => {
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User is not Available");
  }

  const event = await Event.findById(eventId)
    .populate({
      path: "category.categoryId",
      select: "_id title"
    })
    .populate({
      path: "category.subCategory",
      select: "_id title"
    });


  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Event is not Available");
  }

  return event;
};


// all Closed ✅✅✅✅
const closedEvent = async (userID: string, query: Record<string, string>) => {
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User is not Available');
  }

  const todaysDate = new Date();

  // Query builder for closed events
  const queryBuilder = new QueryBuilder(
    Event.find({ userId: user._id, isDraft: false, eventDate: { $lt: todaysDate } }),
    query
  );

  const closedEvents = queryBuilder
    .search(excludeField)
    .filter()
    .dateRange()
    .sort()
    .fields(['eventName',
      'eventDate',
      'image',
      '_id',
      'isFreeEvent',
      'streetAddress',
      'ticketSaleStart',
      'streetAddress2',
      'preSaleStart',])
    .paginate();

  const [meta, data] = await Promise.all([
    closedEvents.getMeta(),
    closedEvents.build(),
  ]);

  if (!data || data.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No closed events found");
  }

  return { meta, data };
};



// AllGetData 💛🩷🧡💙💜🤎
const allDataUseQuery = async (userID: string, query: Record<string, string>) => {
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User is not Available');
  }

  // Base query
  const baseQuery = Event.find({
    userId: user._id,
    $or: [
      { isDraft: true },
      {
        EventStatus: 'UnderReview',
        eventDate: { $gte: new Date() }
      },
      {
        EventStatus: 'Live',
        eventDate: { $gte: new Date() }
      },
    ],
  });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const allEvent = queryBuilder
    .search(excludeField)
    .filter()
    .dateRange()
    .sort()
    .fields([
      'eventName',
      'eventDate',
      'image',
      '_id',
      'isFreeEvent',
      'streetAddress',
      'ticketSaleStart',
      'streetAddress2',
      'preSaleStart',
      'startTime',
      'eventCode'
    ])
    .paginate();

  const [meta, data] = await Promise.all([allEvent.getMeta(), allEvent.build()]);

  return { meta, data };
};


// AllGetData 💛🩷🧡💙💜🤎
const subCategory = async (query?: string) => {
  let subCategories;

  // যদি query থাকে → category অনুসারে data আনবে
  if (query) {
    const objectId = new Types.ObjectId(query);

    subCategories = await SubCategory.find({ categoryId: objectId })
      .populate("categoryId", "title coverImage")
      .lean();

  } else {
    // যদি query না থাকে → সব data আনবে
    subCategories = await SubCategory.find()
      .populate("categoryId", "title coverImage")
      .lean();
  }

  // 🎯 Format করা response
  const formattedData = subCategories.map((sub: any) => ({
    _id: sub._id,
    categoryTitle: sub.categoryId?.title || "N/A",
    title: sub.title,
    coverImage: sub.categoryId?.coverImage,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  }));

  return formattedData;
};


const allCategory = async () => {
  const subCategories = await Category.find()

  return subCategories;
};

// Event History
const eventTicketHistory = async (eventId: string) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event is not Available');
  }
  const ticketHistory = event.tickets;

  return ticketHistory;
};

export const EventService = {
  creteSubCategory,
  createEvent,
  updateEvent,
  creteCategory,
  allLiveEvent,
  singleEvent,
  allDataUseQuery,
  closedEvent,
  updateCategory,
  deleteCategory,
  subCategory,
  allCategory,
  eventTicketHistory,
  updateSubCategory
};
