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
import { USER_ROLES } from "../../../enums/user";

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
        userId: user._id,
        type: "resellPurchase",
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
  // 1️⃣ Check user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 2️⃣ Base query (no status filtering here!)
  let baseQuery = TicketPurchase.find({
    ownerId: userId,
    eventId: eventId,
  });

  if (query.limit) delete query.limit;
  if (query.page) delete query.page;

  query.limit = 99999;

  // 3️⃣ Apply QueryBuilder safely
  const qb = new QueryBuilder(baseQuery, query)
    .search(["ticketName", "ticketType"])
    .filter()
    .dateRange()
    .sort()
    .fields()
    .paginate(); // safe now (limit=99999)

  // 4️⃣ Get filtered tickets
  const tickets = await qb.build();

  console.log("Tickets after QueryBuilder:", tickets.length);

  if (!tickets || tickets.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No tickets found for this event");
  }

  // 5️⃣ Group tickets by type & price
  const grouped: Record<string, any> = {};

  tickets.forEach((ticket: any) => {
    const type = String(ticket.ticketType || "Unknown");
    const sellPrice = ticket.sellAmount ?? 0;

    const key = `${type}_${sellPrice}`;

    if (!grouped[key]) {
      grouped[key] = {
        ticketType: type,
        sellPrice: sellPrice,
        unit: 0,
      };
    }

    grouped[key].unit += 1;
  });

  console.log("Grouped Result:", grouped);

  return Object.values(grouped);
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
        sellerId: ticket.ownerId?._id,
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

  console.log("result", result);

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
  const transactions = await TransactionHistory.find({ resellerId: ownerId }).populate('eventId', 'name image').populate('ticketId', ' ticketType')
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
    .populate("eventId", "eventName eventDate image streetAddress isFreeEvent ")
    .lean();

  const expiredTickets = tickets.filter((ticket: any) => {
    if (ticket.eventId?.eventDate) {
      const eventDate = new Date(ticket.eventId.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < today;
    }
    return false;
  });

  // ⭐ Unique by eventId
  const uniqueExpired = [
    ...new Map(
      expiredTickets.map((item: any) => [item.eventId._id.toString(), item])
    ).values(),
  ];

  console.log("uniqueExpired", uniqueExpired);

  // ⭐ Return formatted response like sold ticket API
  const formattedResponse = uniqueExpired.map((ticket: any) => ({
    ticketId: ticket._id || null,
    purchaseAmount: ticket.purchaseAmount || 0,
    sellAmount: ticket.sellAmount || 0,
    type: "expired",
    eventId: ticket.eventId._id,
    eventName: ticket?.eventId?.eventName,
    eventDate: ticket?.eventId?.eventDate,
    image: ticket?.eventId?.image,
    streetAddress: ticket?.eventId?.streetAddress || null,
    isFreeEvent: ticket?.eventId?.isFreeEvent ?? false,
  }));

  return formattedResponse;
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
const checkEvent = async (userId: string, eventId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  const tickets = await Event.findOne({ eventCode: eventId, userId: user._id });

  if (!tickets) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Event not found");
  }

  if (tickets) {
    return true
  }
  return false
};

const soldTicketHistory = async (
  userId: string,
  eventId: string,
  expired?: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const tickets = await TransactionHistory.findOne({
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: user._id,
  }).populate("eventId", "eventName eventDate");

  if (!tickets) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  const eventDate = new Date((tickets.eventId as any).eventDate);
  const now = new Date();
  const isExpiredEvent = eventDate < now;

  // ----------------------------------------------------
  // CASE 1: expired=true but event NOT expired → return NO DATA
  // ----------------------------------------------------
  if (expired === "true" && !isExpiredEvent) {
    return {
      eventName: (tickets.eventId as any)?.eventName || "",
      expired: false,
      message: "Event not expired yet",
      summary: {},
      details: [],
    };
  }

  // ----------------------------------------------------
  // CASE 2: expired=true AND event is expired → return full data
  // CASE 3: expired not provided → return full data
  // ----------------------------------------------------

  // COUNT UNIQUE TICKET TYPES
  const typeCount: Record<string, number> = {};

  tickets.ticketInfo.forEach((t) => {
    typeCount[t.ticketType] = (typeCount[t.ticketType] || 0) + 1;
  });

  const typeSummary = Object.entries(typeCount).map(([ticketType, count]) => ({
    ticketType,
    count,
  }));

  return {
    eventName: (tickets.eventId as any)?.eventName || "",
    expired: isExpiredEvent,
    summary: {
      totalSellAmount: tickets.purchaseAmount,
      totalMainlandFee: tickets.mainLandFee,
      totalTickets: tickets.ticketQuantity,
      types: typeSummary,
    },
    details: tickets.ticketInfo.map((t) => ({
      ticketType: t.ticketType,
      quantity: t.quantity,
      price: t.ticketPrice,
      commission: t.commission,
    })),
  };
};
const historyTickets = async (userId: string, eventId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  if (user.role === USER_ROLES.USER) {
    const tickets = await TicketPurchase.find({ resellerId: user._id, eventId });
    if (!tickets) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
    }
    return tickets;
  }
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
  checkEvent,
  soldTicketHistory,
  historyTickets
};
