import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { User } from '../../user/user.model';
import { Category, Event, SubCategory } from './Event.model';
import { USER_ROLES } from '../../../../enums/user';
import { TicketPurchase } from '../../user/Ticket/Purchase.Mode';
import { ITicketRequest } from '../../user/Ticket/Purchase.Interface';
import { QueryBuilder } from '../../../builder/QueryBuilder';
import { excludeField } from '../../../../shared/constrant';
import { Types } from 'mongoose';
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



// 1️⃣ Create Event (Draft or Full)
const createEvent = async (payload: any) => {
  const { userId, eventName, isDraft } = payload;

  // ✅ Check if user exists
  const isExistUser = await User.findById(userId);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
  }

  // ✅ Check if user is Organizer
  if (isExistUser.role !== USER_ROLES.ORGANIZER) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only organizer can create Event"
    );
  }

  // ✅ Category validation & ObjectId conversion
  if (payload.category && payload.category.length > 0) {
    const categoryIds = payload.category.map((c: any) => c.categoryId);
    const categories = await Category.find({ _id: { $in: categoryIds } });

    if (categories.length !== payload.category.length) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "One or more categories do not exist!"
      );
    }

    // Convert string IDs to ObjectId
    payload.category = payload.category.map((c: any) => ({
      categoryId: new Types.ObjectId(c.categoryId),
      subCategory: c.subCategory.map((sub: string) => new Types.ObjectId(sub)),
    }));
  }

  // ✅ Handle draft event update
  if (isDraft) {
    let event = await Event.findOne({ userId, eventName, isDraft: true });
    if (event) {
      event = await Event.findByIdAndUpdate(
        event._id,
        { $set: payload },
        { new: true, runValidators: true }
      );
      return event;
    }
  }

  // ✅ Create new event
  const event = await Event.create(payload);
  return event;
};



// 2️⃣ Update Event
const updateEvent = async (eventId: string, userId: string, payload: any) => {
  // ✅ Check if event exists for this user
  const event = await Event.findOne({ _id: eventId, userId });
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Event not found");
  }

  // ✅ Category validation & ObjectId conversion
  if (payload.category && payload.category.length > 0) {
    const categoryIds = payload.category.map((c: any) => c.categoryId);
    const categories = await Category.find({ _id: { $in: categoryIds } });

    if (categories.length !== payload.category.length) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "One or more categories do not exist!"
      );
    }

    // Convert string IDs to ObjectId
    payload.category = payload.category.map((c: any) => ({
      categoryId: new Types.ObjectId(c.categoryId),
      subCategory: c.subCategory.map((sub: string) => new Types.ObjectId(sub)),
    }));
  }

  // ✅ Update the event
  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { $set: payload },
    {
      new: true,
      runValidators: true, // enforce schema validation
    }
  );

  return updatedEvent;
};

// Live
const myLiveEvent = async (userID: string) => {
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User is not Available');
  }
  const allEvents = await Event.find({ userId: userID, EventStatus: 'Live' });
  if (!allEvents) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event is not Available');
  }
  return allEvents;
};

// Live
const singleEvent = async (userID: string, eventId: string) => {
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User is not Available');
  }

  // ✅ Corrected query syntax
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event is not Available');
  }
  return event;
};

// all Closed ✅✅✅✅
const closedEvent = async (userID: string) => {
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User is not Available');
  }
  const todaysDate = new Date();

  // ✅ Corrected query syntax
  const events = await Event.find({ userId: userID, eventDate: { $lt: todaysDate } });
  if (!events || events.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No closed events found");
  }
  return events;
};


const ticketHistory = async (userID: string) => {
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User is not Available');
  }

  const events = await Event.find({ userId: userID }).sort({ createdAt: -1 });
  const purchases = await TicketPurchase.find({
    eventId: { $in: events.map(e => e._id) }
  });

  const result = events.map(event => {
    const eventPurchases = purchases.filter(
      p => p.eventId.toString() === event._id.toString()
    );

    // Count sold tickets by type
    const soldCountByType: Record<string, number> = {};

    eventPurchases.forEach(purchase => {
      purchase.tickets.forEach(ticket => {
        // Handle the nested ticketType structure
        const ticketType = typeof ticket.ticketType === 'string'
          ? ticket.ticketType
          : (ticket.ticketType as any).type;

        if (!soldCountByType[ticketType]) {
          soldCountByType[ticketType] = 0;
        }
        soldCountByType[ticketType] += ticket.quantity;
      });
    });

    let totalTickets = 0;
    let availableTickets = 0;
    let soldTickets = 0;

    const ticketInfo = (event.tickets as EventTicket[]).map(t => {
      const sold = soldCountByType[t.type] || 0;
      const total = t.availableUnits + sold; // Total = available + sold

      totalTickets += total;
      availableTickets += t.availableUnits;
      soldTickets += sold;

      return {
        type: t.type,
        price: t.price,
        availableUnits: t.availableUnits,
        sold,
        total, // Added total for each ticket type
      };
    });

    return {
      eventId: event._id,
      eventName: event.eventName,
      totalTickets,
      soldTickets,
      availableTickets,
      tickets: ticketInfo,
    };
  });

  return result;
};


// AllGetData 💛🩷🧡💙💜🤎
const allDataUseQuery = async (userID: string, query: Record<string, string>) => {
  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User is not Available');
  }
  const queryBuilder = new QueryBuilder(Event.find(), query);

  const allEvent = queryBuilder
    .search(excludeField)
    .filter()
    .dateRange()
    .sort()
    .fields()
    .paginate();

  const [meta, data] = await Promise.all([
    allEvent.getMeta(),
    allEvent.build(),
  ]);

  return { meta, data };
};


export const EventService = {
  creteSubCategory,
  createEvent,
  updateEvent,
  creteCategory,
  myLiveEvent,
  singleEvent,
  allDataUseQuery,
  closedEvent,
  updateCategory,
  ticketHistory
};
