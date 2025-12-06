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
import unlinkFile from '../../../../shared/unlinkFile';
import { Favourite } from '../../Favoutite/Favourite.model';
import { AggregationQueryBuilder } from '../../../builder/AggregationBuilder';
import { TicketPurchase } from '../../Ticket/ticket.model';
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
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Category not found");
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!updateCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Updated Category failed");
  }


  if (updateData.coverImage && category.coverImage) {
    unlinkFile(category.coverImage)
  }

  return updatedCategory;
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

// UPDATE Notification
const updateNotification = async (eventId: string, userId: string, payload: any) => {
  // Check event exists
  const event = await Event.findOne({ _id: eventId, userId });
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Event not found");
  }

  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { $notification: payload, $set: payload },
    { new: true, runValidators: true }
  );

  return updatedEvent;
};

const allLiveEvent = async (query: Record<string, string>) => {
  const eventsToUpdate = await Event.find({ EventStatus: 'Live' }).select("eventDate EventStatus");

  for (const event of eventsToUpdate) {
    if (!event) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Event is not available');
    }
    if (event.eventDate && event.eventDate < new Date()) {
      event.EventStatus = IEventStatus.Expired;
      await event.save();
    }
  }


  const baseQuery = Event.find({ EventStatus: 'Live' })
    .select("image eventName eventDate ticketSaleStart streetAddress2 streetAddress preSaleStart startTicketSale");

  const queryBuilder = new QueryBuilder(baseQuery, query);
  const allEvents = queryBuilder
    .search(excludeField)
    .filter()
    .dateRange()
    .sort()
    .fields()
    .paginate();

  const [meta, data] = await Promise.all([
    allEvents.getMeta(),
    allEvents.build()
  ]);

  return { meta, data };
};

const popularEvent = async (query: Record<string, string>) => {
  // Pagination setup
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Search setup
  const searchTerm = query.searchTerm || '';
  const searchCondition = searchTerm ? {
    eventName: { $regex: searchTerm, $options: 'i' }
  } : {};

  // Sort setup
  const sortField = query.sortBy || 'totalTicketBuyers';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  const pipeline: any[] = [
    // Search filter (if searchTerm exists)
    ...(searchTerm ? [{ $match: searchCondition }] : []),

    // Calculate total ticket buyers
    {
      $addFields: {
        totalTicketBuyers: {
          $size: {
            $reduce: {
              input: "$tickets",
              initialValue: [],
              in: {
                $setUnion: [
                  "$$value",
                  { $ifNull: ["$$this.ticketBuyerId", []] }
                ]
              }
            }
          }
        }
      }
    },

    // Sort
    { $sort: { [sortField]: sortOrder } },

    // Lookup category details
    {
      $lookup: {
        from: "categories",
        localField: "category.categoryId",
        foreignField: "_id",
        as: "categoryDetails",
      }
    },

    // Lookup subcategory details
    {
      $lookup: {
        from: "subcategories",
        localField: "category.subCategory",
        foreignField: "_id",
        as: "subcategoryDetails",
      }
    },

    // Lookup user details
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      }
    },

    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      }
    },

    // Project only required fields
    {
      $project: {
        _id: 1,
        eventName: 1,
        image: 1,
        eventDate: 1,
        streetAddress: 1,
        streetAddress2: 1,
        isFreeEvent: 1,
        totalTicketBuyers: 1,
        totalEarned: 1
      }
    },
  ];

  // Count total documents (for meta)
  const totalPipeline = [...pipeline, { $count: 'total' }];
  const totalResult = await Event.aggregate(totalPipeline);
  const total = totalResult[0]?.total || 0;

  // Add pagination to main pipeline
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  // Execute main query
  const data = await Event.aggregate(pipeline);

  // Calculate meta
  const meta = {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit)
  };

  return { meta, data };
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
  const { EventStatus: status, isDraft } = query;
  console.log(status);

  const today = new Date();

  const baseQuery = Event.find({
    userId: user._id,
    $or: [
      { isDraft: isDraft },
      {
        EventStatus: status,
        eventDate: { $gte: today }
      },
    ]
  });

  // QueryBuilder chaining (search, filter, sort, pagination)
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
      'EventStatus',
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
// AllUnderReview 
const allUndewReview = async (userID: string, query: Record<string, string>) => {
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User is not Available');
  }
  const { EventStatus: status } = query
  const today = new Date();

  const baseQuery = Event.find({
    EventStatus: status,
    eventDate: { $gte: today },
  });


  // QueryBuilder chaining (search, filter, sort, pagination)
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
      'EventStatus',
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
      .populate("categoryId", "title coverImage ")
      .lean();

  } else {
    // যদি query না থাকে → সব data আনবে
    subCategories = await SubCategory.find()
      .populate("categoryId", "title coverImage categoryId")
      .lean();
  }

  // 🎯 Format করা response
  const formattedData = subCategories.map((sub: any) => ({
    _id: sub._id,
    categoryTitle: sub.categoryId?.title || "N/A",
    categoryId: sub.categoryId?._id,
    title: sub.title,
    coverImage: sub.categoryId?.coverImage,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  }));

  return formattedData;
};

const allCategory = async (userId: string, query: Record<string, string>) => {
  const { includeSelectedSubcategory } = query;

  // Load all categories
  const categories = await Category.find();

  // If includeSelectedSubcategory is not requested, return all categories as is
  if (includeSelectedSubcategory === undefined) {
    return categories;
  }

  // Load user favourites
  const favourites = await Favourite.find({ favouriterUserId: userId });

  // Step 1: Create a Map of favourite category and its subCategoryIds
  const favMap = new Map<string, string[]>();
  favourites.forEach((fav: any) => {
    favMap.set(
      fav.categoryId.toString(),
      fav.subCategoryId.map((id: any) => id.toString())
    );
  });

  // Step 2: Process ALL categories (not just favourite ones)
  const result = await Promise.all(
    categories.map(async (cat: any) => {
      const favSubIds = favMap.get(cat._id.toString()) || [];

      // If this category has favourite subcategories, fetch and filter them
      if (favSubIds.length > 0) {
        const allSubcategories = await SubCategory.find({
          categoryId: cat._id
        });

        const filteredSubcategories = allSubcategories.filter((sub: any) =>
          favSubIds.includes(sub._id.toString())
        );

        return {
          ...cat.toObject(),
          subCategories: filteredSubcategories,
        };
      }

      // If no favourites for this category, return category with empty subcategories
      return {
        ...cat.toObject(),
        subCategories: [],
      };
    })
  );

  return result;
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

// BarCode Check
const barCodeCheck = async (ownerId: string, userId: string, eventId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User is not Available');
  }

  const event = await Event.findOne({ _id: new Types.ObjectId(eventId), userId: new Types.ObjectId(userId) });
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, `Event is not Available for this user`);
  }

  const ticket = await TicketPurchase.find({ ownerId: new Types.ObjectId(ownerId), eventId: event._id, status: 'available' });
  await TicketPurchase.updateMany({ ownerId: new Types.ObjectId(ownerId), eventId: event._id, status: 'available' }, { status: 'used' });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket is not Available');
  }
  return [];
};

export const EventService = {
  creteSubCategory,
  createEvent,
  updateEvent,
  updateNotification,
  creteCategory,
  allLiveEvent,
  popularEvent, //popo
  singleEvent,
  allDataUseQuery,
  closedEvent,
  updateCategory,
  deleteCategory,
  subCategory,
  allCategory,
  eventTicketHistory,
  updateSubCategory,
  allUndewReview,
  barCodeCheck
};
