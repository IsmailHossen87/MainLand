// ============================================
// 1. TICKET RESELL LISTING

import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { ResellTicket, SecondaryTicketPurchase, TicketPurchase } from './Purchase.Mode';
import { JwtPayload } from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import { User } from '../user.model';
import { ITicketPurchase } from './Purchase.Interface';
import { createLogger } from 'winston';

// ============================================
const createResellListing = async (payload: any, user: JwtPayload) => {
  const { originalTicketId, ticketType, quantity, resellPrice } = payload;

  // Check original ticket exists
  const originalTicket = await TicketPurchase.findById(originalTicketId);

  if (!originalTicket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Original ticket not found');
  }

  // Check user owns the ticket
  if (originalTicket.userId.toString() !== user.id) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not own this ticket');
  }

  // Find ticket details
  const ticket = originalTicket.tickets.find(t => t.ticketType === ticketType);
  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket type not found');
  }

  // Check quantity
  if (quantity > ticket.quantity) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Not enough tickets to resell');
  }

  // Create resell listing
  const resellTicket = await ResellTicket.create({
    originalTicketId,
    sellerId: user.id,
    eventId: originalTicket.eventId,
    ticketType,
    quantity,
    originalPrice: Number(ticket.quantity) * Number(resellPrice),
    resellPrice,
    status: 'available',
  });
  //   ReSellKorle Avaailable Ticket kome jabe
  await TicketPurchase.updateOne(
    {
      _id: originalTicketId,
      'tickets.ticketType': ticketType,
    },
    {
      $inc: { 'tickets.$.quantity': -quantity },
    }
  );

  return resellTicket;
};

// ============================================
// 2. GET ALL AVAILABLE RESELL TICKETS
// ============================================
const availAbleTicket = async (query: Record<string, any>) => {
  const { eventId, ticketType } = query;

  const filter: Record<string, any> = {
    tickets: { $exists: true, $ne: [], $not: { $size: 0 } },
    'tickets.quantity': { $gt: 0 },
  };
  if (eventId) {
    filter.eventId = eventId;
  }

  if (ticketType) {
    filter['tickets.ticketType'] = ticketType;
  }

  const resellTickets = await TicketPurchase.find(filter)
    .populate('eventId', 'title date location')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  return resellTickets;
};

const getLiveTicket = async (query: Record<string, any>) => {
  const filter: any = { status: 'available', quantity: { $gt: 0 } };

  const resellTickets = await ResellTicket.find(filter)
    .populate('eventId', 'title date location')
    .populate('sellerId', 'name email')
    .sort({ listingDate: -1 });

  return resellTickets;
};

const getSoldedTicket = async (userId: string, query: Record<string, any>) => {


  const resellTickets = await SecondaryTicketPurchase.findById(userId)
    .populate('eventId', 'title date location')
    .populate('sellerId', 'name email')
    .sort({ listingDate: -1 });

  return resellTickets;
};

// ============================================
// 4. CANCEL RESELL LISTING
// ============================================
const cancelResellListing = async (
  resellTicketId: string,
  user: JwtPayload
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1️⃣ Find the resell ticket
    const resellTicket = await ResellTicket.findById(resellTicketId).session(
      session
    );

    if (!resellTicket) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Resell ticket not found");
    }


    // 2️⃣ Check if the user is the seller
    if (resellTicket.sellerId.toString() !== user.id) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You are not authorized to cancel this listing"
      );
    }

    // 3️⃣ Check if status is "available" (only available listings can be cancelled)
    if (resellTicket.status !== "available") {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot cancel a listing that is not available"
      );
    }

    // 4️⃣ Find the original ticket purchase
    const ticketPurchase = await TicketPurchase.findById(
      resellTicket.originalTicketId
    ).session(session);

    if (!ticketPurchase) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Original ticket purchase not found"
      );
    }

    // 5️⃣ Find the specific ticket in the tickets array - FIXED COMPARISON
    const ticketIndex = ticketPurchase.tickets.findIndex(
      (ticket) => ticket.ticketType.toString() === resellTicket.ticketType.toString()
    );

    if (ticketIndex === -1) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Ticket type not found in purchase"
      );
    }

    // 6️⃣ Add the quantity back to the original ticket purchase
    ticketPurchase.tickets[ticketIndex].quantity += resellTicket.quantity;

    // 7️⃣ Save the updated ticket purchase
    await ticketPurchase.save({ session });

    // 8️⃣ Delete the resell ticket
    await ResellTicket.findByIdAndDelete(resellTicketId).session(session);

    await session.commitTransaction();

    return {
      message: "Resell listing cancelled successfully",
      restoredQuantity: resellTicket.quantity,
      ticketType: resellTicket.ticketType,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};


// expired ticket
const getExpiredTicket = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

  const purchases = await TicketPurchase.find({ userId })
    .populate("eventId", "eventName eventDate startTime endTime location")
    .lean();

  const now = new Date();

  const expiredTickets = purchases
    .filter(p => {
      const event = p.eventId as any;
      return event?.eventDate && new Date(event.eventDate) < now;
    })
    .map(p => {
      const event = p.eventId as any;
      return {
        purchaseId: p._id,
        eventId: event._id,
        eventTitle: event.eventName,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        tickets: p.tickets,
        totalAmount: p.totalAmount,
      };
    });


  return expiredTickets;
};




export const ResellTicketService = {
  createResellListing,
  availAbleTicket,
  getLiveTicket,
  getSoldedTicket,
  getExpiredTicket,
  cancelResellListing
};
