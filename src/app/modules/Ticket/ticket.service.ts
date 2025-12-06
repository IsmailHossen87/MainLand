import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { User } from "../user/user.model";
import { TicketPurchase } from "./ticket.model";
import { QueryBuilder } from "../../builder/QueryBuilder";
import { excludeField } from "../../../shared/constrant";
import mongoose from "mongoose";
import { ITicketStatus, IResellTicket, IDiscountCode } from "./ticket.interface";
import { TransactionHistory } from "../Payment/transactionHistory";
import { Event } from "../ORGANIZER/Event/Event.model";

const getAllTicket = async (userId: string, query: Record<string, any>) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // 2️⃣ Initialize base query
  const baseQuery = TicketPurchase.find({ ownerId: userId, }).populate('eventId', 'image eventName');
  const queryBuilder = new QueryBuilder(baseQuery, query);

  // 3️⃣ Apply queryBuilder methods
  const allTickets = queryBuilder
    .search(excludeField)
    .filter()
    .dateRange()
    .sort()
    .fields()
    .paginate();

  const [meta, data] = await Promise.all([
    allTickets.getMeta(),
    allTickets.build(),
  ]);

  // 5️⃣ Return result
  return { meta, data };
};
// GetOneTicket
const getOneTicket = async (userId: string, ticeketId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // 2️⃣ Initialize base query
  const baseQuery = TicketPurchase.find({ ownerId: userId, });
  const ticket = await baseQuery.findOne({ _id: ticeketId }).populate('eventId', 'image eventName');
  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  // 5️⃣ Return result
  return ticket;
};
//////////////////
//  GET UNIQUE EVENTS
//////////////////
const getUniqueEvents = async (userId: string, query: Record<string, any>) => {
  const { status } = query;
  console.log("status", status);
  // 1️⃣ Check user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 2️⃣ Aggregation pipeline
  const baseQuery = TicketPurchase.aggregate([
    {
      $match: {
        ownerId: new mongoose.Types.ObjectId(userId),
        status: status || ITicketStatus.onsell,
      }
    },
    {
      $group: {
        _id: "$eventId",
        ticketId: { $first: "$_id" }
      }
    },
    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "_id",
        as: "event"
      }
    },
    { $unwind: "$event" },
    { $sort: { "event.eventDate": 1 } },
    {
      $match: {
        "event.eventDate": { $gte: new Date() }
      }
    },
    {
      $project: {
        _id: 0,
        eventId: "$_id",
        eventName: "$event.eventName",
        eventDate: "$event.eventDate",
        isFreeEvent: "$event.isFreeEvent",
        streetAddress: "$event.streetAddress",
        ticketSaleStart: "$event.ticketSaleStart",
        streetAddress2: "$event.streetAddress2",
        preSaleStart: "$event.preSaleStart",
        image: "$event.image",
        address: "$event.streetAddress",
        ticketId: 1
      }
    }
  ]);

  const result = await baseQuery.exec();
  return result;
};
//////////////////
//  GET SOLD EVENTS
//////////////////
const getSoldEvent = async (userId: string) => {

  // 1️⃣ User exists check
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 2️⃣ Aggregation pipeline
  const result = await TransactionHistory.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      }
    },
    {
      $group: {
        _id: "$eventId",
        ticketId: { $first: "$ticketId" },
        purchaseAmount: { $first: "$purchaseAmount" },
        sellAmount: { $first: "$sellAmount" },
        type: { $first: "$type" },
      }
    },
    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "_id",
        as: "event"
      }
    },
    { $unwind: "$event" },
    { $sort: { "event.eventDate": 1 } },
    {
      $match: {
        "event.eventDate": { $gte: new Date() }
      }
    },
    {
      $project: {
        _id: 0,
        eventId: "$_id",
        eventName: "$event.eventName",
        eventDate: "$event.eventDate",
        image: "$event.image",
        streetAddress: "$event.streetAddress",
        isFreeEvent: "$event.isFreeEvent",
        ticketId: 1,
        purchaseAmount: 1,
        sellAmount: 1,
        type: 1,
      }
    }
  ]);

  return result;
};


const sellTicketInfoUsers = async (
  userId: string,
  eventId: string,
  query: Record<string, any>
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 1️⃣ Base query (fixed filters)
  const baseQuery = TicketPurchase.find({
    ownerId: userId,
    eventId: eventId,
  });

  // 2️⃣ Apply QueryBuilder filters
  const qb = new QueryBuilder(baseQuery, query)
    .search(["ticketName", "ticketType"])
    .filter()
    .dateRange()
    .sort()
    .fields()
    .paginate();

  // 3️⃣ Execute filtered query
  const tickets = await qb.build();

  if (!tickets || tickets.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No tickets found for this event");
  }

  // 4️⃣ Group tickets by type AND sellPrice
  const ticketsByTypeAndPrice: Record<string, {
    ticketType: string;
    sellPrice: number;
    unit: number;
  }> = {};

  tickets.forEach((ticket: any) => {
    const type = String(ticket.ticketType || "Unknown");
    const sellPrice = ticket.sellAmount || 0;

    // Create a unique key combining type and sellPrice
    const key = `${type}_${sellPrice}`;

    if (!ticketsByTypeAndPrice[key]) {
      ticketsByTypeAndPrice[key] = {
        ticketType: type,
        sellPrice: sellPrice,
        unit: 0,
      };
    }

    ticketsByTypeAndPrice[key].unit += 1;
  });

  return Object.values(ticketsByTypeAndPrice);
};

const sellTicketInfoUsersOnsell = async (
  userId: string,
  eventId: string,
  query: Record<string, any>
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Base query
  const baseQuery = TicketPurchase.find({
    ownerId: userId,
    eventId: eventId,
  }).populate("ownerId", "name");;

  // QueryBuilder
  const qb = new QueryBuilder(baseQuery, query)
    .search(["ticketName", "ticketType"])
    .filter()
    .dateRange()
    .sort()
    .fields()
    .paginate();

  const tickets = await qb.build();

  if (!tickets || tickets.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No tickets found for this event");
  }

  // Group by ticketType + purchaseAmount
  const grouped: Record<string, any> = {};

  tickets.forEach((ticket: any) => {
    const type = String(ticket.ticketType || "Unknown");
    const price = Number(ticket.sellAmount || 0);

    // unique key: type + price
    const key = `${type}-${price}`;

    if (!grouped[key]) {
      grouped[key] = {
        type: type,
        price: price,
        ownerName: ticket.ownerId?.name || "Unknown",
        availableUnits: 0,
      };
    }

    grouped[key].availableUnits += 1;
  });

  return Object.values(grouped);
};
const availableTypeHistory = async (
  userId: string,
  eventId: string,
) => {
  // 1️⃣ Check user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 2️⃣ Get all 'onsell' tickets for the event
  const tickets = await TicketPurchase.find({
    eventId,
    status: ITicketStatus.onsell
  })
    .populate("ownerId", "userName")
    .lean();

  if (!tickets || tickets.length === 0) {
    return {
      success: true,
      message: "No onsell tickets found for this event",
      data: [],
    };
  }

  // 3️⃣ Count tickets per type
  const typeCountMap: Record<string, number> = {};

  tickets.forEach((ticket: any) => {
    const type = String(ticket.ticketType || "Unknown");
    typeCountMap[type] = (typeCountMap[type] || 0) + 1;
  });

  // 4️⃣ Convert to array
  const result = Object.entries(typeCountMap).map(([type, quantity]) => ({
    type,
    quantity,
  }));

  return result;
};

// 👊👊
const allOnsellTicketInfo = async (
  userId: string,
  query: Record<string, any>,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 1️⃣ Base query - sob tickets
  const baseQuery = TicketPurchase.find({
    status: ITicketStatus.onsell,
  }).populate('ownerId', 'name');

  // 2️⃣ Apply QueryBuilder filters
  const qb = new QueryBuilder(baseQuery, query)
    .search(["ticketName", "ticketType"])
    .filter()
    .dateRange()
    .sort()
    .fields()
    .paginate();

  // 3️⃣ Execute filtered query
  const tickets = await qb.build();

  if (!tickets || tickets.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No tickets found");
  }

  // 4️⃣ Check if ticketType query exists
  const hasTicketTypeQuery = query.ticketType !== undefined;

  if (hasTicketTypeQuery) {
    // ✅ WITH ticketType query - Group by type AND owner
    const ticketsByTypeAndOwner: Record<string, Record<string, {
      ticketType: string;
      ownerId: string;
      ownerName: string;
      totalPurchaseTicket: number;
      totalSellAmount: number;
    }>> = {};

    tickets.forEach((ticket: any) => {
      const type = String(ticket.ticketType || "Unknown");
      const owner = String(ticket.ownerId?._id || "Unknown");
      const ownerName = ticket.ownerId?.name || "Unknown";

      if (!ticketsByTypeAndOwner[type]) {
        ticketsByTypeAndOwner[type] = {};
      }

      if (!ticketsByTypeAndOwner[type][owner]) {
        ticketsByTypeAndOwner[type][owner] = {
          ticketType: type,
          ownerId: owner,
          ownerName: ownerName,
          totalPurchaseTicket: 0,
          totalSellAmount: 0,
        };
      }

      ticketsByTypeAndOwner[type][owner].totalPurchaseTicket += 1;
      ticketsByTypeAndOwner[type][owner].totalSellAmount += ticket.sellAmount || 0;
    });

    // Convert to flat array
    const result: any[] = [];
    Object.values(ticketsByTypeAndOwner).forEach(ownerGroup => {
      result.push(...Object.values(ownerGroup));
    });

    return result;

  } else {
    // ✅ WITHOUT ticketType query - Group by type only
    const ticketsByType: Record<string, {
      ticketType: string;
      totalPurchaseTicket: number;
      sellAmountPerTicket: number;
    }> = {};

    tickets.forEach((ticket: any) => {
      const type = String(ticket.ticketType || "Unknown");

      if (!ticketsByType[type]) {
        ticketsByType[type] = {
          ticketType: type,
          totalPurchaseTicket: 0,
          sellAmountPerTicket: 0,
        };
      }

      ticketsByType[type].totalPurchaseTicket += 1;
      ticketsByType[type].sellAmountPerTicket += ticket.sellAmount || 0;
    });

    return Object.values(ticketsByType);
  }
};
// ResellTicket
const resellTicket = async (userId: string, eventId: string, tickets: IResellTicket[]) => {
  // 1️⃣ Check user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const results = [];
  let totalSellAmount = 0;

  // 2️⃣ Loop through each ticket type
  for (const ticket of tickets) {
    const { ticketType, quantity, resellAmount } = ticket;

    // 3️⃣ Find available tickets
    const availableTickets = await TicketPurchase.find({
      ownerId: userId,
      eventId: eventId,
      ticketType: ticketType,
      status: ITicketStatus.available
    }).limit(quantity);

    // 4️⃣ Check if enough tickets available
    if (availableTickets.length < quantity) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Not enough tickets available. You have ${availableTickets.length} ${ticketType} tickets, but requested ${quantity}`
      );
    }

    // 5️⃣ Update tickets status to 'onsell' and set resell amount
    const ticketIds = availableTickets.map(t => t._id);

    const updatedTickets = await TicketPurchase.updateMany(
      { _id: { $in: ticketIds } },
      {
        $set: {
          status: ITicketStatus.onsell,
          sellAmount: resellAmount
        }
      }
    );

    // 6️⃣ Add to results
    results.push({
      message: `Successfully listed ${quantity} ${ticketType} ticket(s) for resale`,
      ticketsUpdated: updatedTickets.modifiedCount,
      resellAmount: resellAmount,
      ticketType: ticketType
    });

    totalSellAmount += resellAmount;
  }

  // 7️⃣ Update user's total sell amount
  await user.updateOne({
    $inc: {
      sellAmount: totalSellAmount
    }
  });

  // 8️⃣ Return all results
  return {
    totalTicketTypes: tickets.length,
    totalSellAmount: totalSellAmount,
    details: results
  };
};
// withdrawPro
const withdrawPro = async (
  userId: string,
  eventId: string,
) => {

  // 1️⃣ Check user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 2️⃣ Find resold (live) tickets to withdraw
  const liveTickets = await TicketPurchase.find({
    ownerId: userId,
    eventId,
    status: ITicketStatus.onsell,
  })
    .sort({ createdAt: 1 })
  // 4️⃣ Update selected tickets → available
  const ticketIds = liveTickets.map((ticket) => ticket._id);

  await TicketPurchase.updateMany(
    { _id: { $in: ticketIds } },
    {
      $set: {
        status: ITicketStatus.available,
        sellAmount: 0,
        totalEarned: 0,
        discount: 0,
      },
    }
  );

  return {
    success: true,
    message: `Tickets withdrawn successfully.`,
  };
};
const soldTicket = async (userId: string) => {
  const ownerId = new mongoose.Types.ObjectId(userId);

  // 1️⃣ Check user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  const transactions = await TransactionHistory.find({ userId: ownerId }).populate('eventId', 'name image').populate('ticketId', ' ticketType')
    .sort({ createdAt: -1 })
    .limit(10);

  if (!transactions) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No transactions found");
  }
  return transactions;
};

const ticketExpired = async (userId: string) => {
  const ownerId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(ownerId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tickets = await TicketPurchase.find({ ownerId })
    .populate("eventId", "name eventDate image")
    .lean();

  const expiredTickets = tickets.filter((ticket: any) => {
    if (ticket.eventId?.eventDate) {
      const eventDate = new Date(ticket.eventId.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < today;
    }
    return false;
  });

  // ⭐ Make unique by eventId
  const uniqueExpired = [
    ...new Map(
      expiredTickets.map((item: any) => [item.eventId._id.toString(), item])
    ).values(),
  ];

  return uniqueExpired;
};


// EVENT SUMMARY
const eventSummary = async ({ userId, sellerType, ticketType, eventId }: any) => {
  const ownerId = new mongoose.Types.ObjectId(userId);

  const user = await User.findById(ownerId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  let allEventsTicketHistory;

  if (sellerType === 'organizer') {
    allEventsTicketHistory = await Event.findById(eventId).select('tickets.availableUnits tickets.type tickets.price -_id');
    if (!allEventsTicketHistory) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Event not found");
    }
    return allEventsTicketHistory;
  }
  if (sellerType === 'user') {
    allEventsTicketHistory = await TicketPurchase.find({ ownerId: ownerId }).select('tickets.availableUnits tickets.type tickets.price -_id');
    if (!allEventsTicketHistory) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Event not found");
    }
    return allEventsTicketHistory;
  }
  return allEventsTicketHistory;
};

const promocode = async (userId: string, id: string, code: string) => {
  // User check
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Event find
  const event = await Event.findOne({
    _id: id,
    "discountCodes.code": code
  });

  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Promo code not found or invalid");
  }

  // 🚀 Safely handle undefined discountCodes
  const discountCode = event.discountCodes?.find(
    (dc: IDiscountCode) => dc.code === code
  );

  if (!discountCode) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Discount code not found");
  }

  return discountCode;
};



// BAR-CODE generate
const checkEvent = async (userId: string, eventCode: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  const tickets = await Event.findOne({ eventCode: eventCode, ownerId: user._id });
  if (!tickets) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Event not found");
  }

  if (tickets) {
    return true
  }
  return false
};


export const TicketService = {
  getAllTicket,
  getOneTicket,
  getUniqueEvents,
  sellTicketInfoUsers,
  allOnsellTicketInfo,
  resellTicket,
  soldTicket,
  ticketExpired,
  getSoldEvent,
  eventSummary,
  promocode,
  withdrawPro,
  sellTicketInfoUsersOnsell,
  availableTypeHistory,
  checkEvent
};
