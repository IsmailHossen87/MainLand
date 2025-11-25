import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { User } from "../user/user.model";
import { TicketPurchase } from "./ticket.model";
import { QueryBuilder } from "../../builder/QueryBuilder";
import { excludeField } from "../../../shared/constrant";

const getAllTicket = async (userId: string, query: Record<string, any>) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // 2️⃣ Initialize base query
    const baseQuery = TicketPurchase.find({ ownerId: userId, }).populate('eventId', 'image eventName');;
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
    const ticket = await baseQuery.findOne({ _id: ticeketId }).populate('eventId','image eventName');
    if (!ticket) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
    }

    // 5️⃣ Return result
    return ticket;
};
// uniqueEvent
import mongoose from "mongoose";
import { ITicketStatus, IResellTicket } from "./ticket.interface";

const getUniqueEvents = async (userId: string) => {
    // 1️⃣ Check user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }
    // 2️⃣ Aggregation pipeline
    const uniqueEvents = await TicketPurchase.aggregate([
        {
            $match: {
                ownerId: new mongoose.Types.ObjectId(userId)
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
        {
            $project: {
                _id: 0,
                eventId: "$_id",
                eventName: "$event.eventName",
                image: "$event.image",
                address:"$event.streetAddress",
                ticketId: 1
            }
        }
    ]);

    return uniqueEvents;
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

  // 4️⃣ Group tickets by type
  const ticketsByType: Record<string, {
    ticketType: string;
    totalPurchaseTicket: number;
    totalPurchaseAmount: number;
  }> = {};

  tickets.forEach((ticket: any) => {
    const type = String(ticket.ticketType || "Unknown");

    if (!ticketsByType[type]) {
      ticketsByType[type] = {
        ticketType: type,
        totalPurchaseTicket: 0,
        totalPurchaseAmount: 0,
      };
    }

    ticketsByType[type].totalPurchaseTicket += 1;
    ticketsByType[type].totalPurchaseAmount += ticket.purchaseAmount || 0;
  });

  // 5️⃣ Convert to array
  return Object.values(ticketsByType);
};

const allOnsellTicketInfo = async (
  userId: string,
  query: Record<string, any>
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
const resellTicket = async (userId: string, eventId: string, payload: IResellTicket) => { 
    const { ticketType, quantity, resellAmount } = payload;
    
    // 1️⃣ Check user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    }

    const availableTickets = await TicketPurchase.find({
        ownerId: userId,
        eventId: eventId,
        ticketType: ticketType,
        status: ITicketStatus.available 
    }).limit(quantity);

    // 3️⃣ Check if enough tickets available
    if (availableTickets.length < quantity) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST, 
            `Not enough tickets available. You have ${availableTickets.length} ${ticketType} tickets, but requested ${quantity}`
        );
    }

    // 4️⃣ Update tickets status to 'onsell' and set resell amount
    const ticketIds = availableTickets.map(ticket => ticket._id);
    
    const updatedTickets = await TicketPurchase.updateMany(
        { _id: { $in: ticketIds } },
        { 
            $set: { 
                status: ITicketStatus.onsell,
                sellAmount: resellAmount 
            } 
        }
    );
    // 5️⃣ Return updated information
    return {
        message: `Successfully listed ${quantity} ${ticketType} ticket(s) for resale`,
        ticketsUpdated: updatedTickets.modifiedCount,
        resellAmount: resellAmount,
        ticketType: ticketType
    };
};
// withdrawTicket
const withdrawTicket = async (
  userId: string,
  eventId: string,
  payload: IResellTicket
) => {
  const { ticketType, quantity } = payload;

  // 1️⃣ Check user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // 2️⃣ Find resold (live) tickets to withdraw
  const liveTickets = await TicketPurchase.find({
    ownerId: userId,
    eventId,
    ticketType,
    status: ITicketStatus.onsell, 
  })
    .sort({ createdAt: 1 }) 
    .limit(quantity);

  // 3️⃣ Validate enough tickets available for withdraw
  if (liveTickets.length < quantity) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `You have only ${liveTickets.length} live ${ticketType} tickets, but tried to withdraw ${quantity}.`
    );
  }
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
    message: `${quantity} ${ticketType} tickets withdrawn successfully.`,
  };
};


export const TicketService = {
    getAllTicket,
    getOneTicket,
    getUniqueEvents,
    sellTicketInfoUsers,
    allOnsellTicketInfo,
    resellTicket,
    withdrawTicket
};
