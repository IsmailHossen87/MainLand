// ============================================
// 1. TICKET RESELL LISTING

import { StatusCodes } from "http-status-codes";
import ApiError from "../../../../errors/ApiError";
import { ResellTicket, TicketPurchase } from "./Purchase.Mode";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

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
    "tickets.ticketType": ticketType,
  },
  {
    $inc: { "tickets.$.quantity": -quantity }
  }
);

  return resellTicket;
};


// ============================================
// 2. GET ALL AVAILABLE RESELL TICKETS
// ============================================
const getResellTickets = async (query: Record<string, any>) => {
  const { eventId, ticketType } = query;

  const filter: any = { status: 'available' };
  if (eventId) filter.eventId = eventId;
  if (ticketType) filter.ticketType = ticketType;

  const resellTickets = await ResellTicket.find(filter)
    .populate('eventId', 'title date location')
    .populate('sellerId', 'name email')
    .sort({ listingDate: -1 });

  return resellTickets;
};


// ============================================
// 3. BUY RESELL TICKET
// ============================================
const buyResellTicket = async (resellTicketId: string, buyer: JwtPayload, payload: any) => {
  const resellTicket = await ResellTicket.findById(resellTicketId);

  if (!resellTicket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Resell ticket not found');
  }

  if (resellTicket.status !== 'available') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Ticket already sold');
  }

  // Buyer cannot be the seller
  if (resellTicket.sellerId.toString() === buyer.userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot buy your own ticket');
  }

  // Create new purchase for buyer
  const newPurchase = await TicketPurchase.create({
    eventId: resellTicket.eventId,
    userId: buyer.userId,
    attenInformation: payload.attenInformation,
    tickets: [
      {
        ticketType: {
          ticketType: resellTicket.ticketType,
          quantity: resellTicket.quantity,
        },
      },
    ],
    mailLandFee: payload.mailLandFee || 0,
    totalAmount: resellTicket.resellPrice,
    discount: 0,
  });

  // Update resell ticket status
  resellTicket.status = 'sold';
  resellTicket.soldTo = new Types.ObjectId(buyer.userId);
  resellTicket.soldAt = new Date();
  await resellTicket.save();

  // Reduce quantity from original seller's ticket
  const originalTicket = await TicketPurchase.findById(resellTicket.originalTicketId);
  if (originalTicket) {
    const ticketIndex = originalTicket.tickets.findIndex(
      t => t.ticketType.ticketType === resellTicket.ticketType
    );
    if (ticketIndex !== -1) {
      originalTicket.tickets[ticketIndex].ticketType.quantity -= resellTicket.quantity;
      
      // Remove ticket if quantity is 0
      if (originalTicket.tickets[ticketIndex].ticketType.quantity <= 0) {
        originalTicket.tickets.splice(ticketIndex, 1);
      }
      
      await originalTicket.save();
    }
  }

  return newPurchase;
};


// ============================================
// 4. CANCEL RESELL LISTING
// ============================================
const cancelResellListing = async (resellTicketId: string, user: JwtPayload) => {
  const resellTicket = await ResellTicket.findById(resellTicketId);

  if (!resellTicket) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Resell ticket not found');
  }

  if (resellTicket.sellerId.toString() !== user.userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Not your listing');
  }

  if (resellTicket.status === 'sold') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot cancel sold ticket');
  }

  resellTicket.status = 'cancelled';
  await resellTicket.save();

  return resellTicket;
};

export const ResellTicketService ={createResellListing,getResellTickets,buyResellTicket,cancelResellListing}