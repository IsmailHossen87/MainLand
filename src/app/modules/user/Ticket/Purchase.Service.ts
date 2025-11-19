// ============================================
// 1. TICKET RESELL LISTING

import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { ResellTicket, SecondaryTicketPurchase, TicketPurchase } from './Purchase.Mode';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';

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
const getSoldedTicket = async ( userId:string,query: Record<string, any>) => {


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

export const ResellTicketService = {
  createResellListing,
  availAbleTicket,
  getLiveTicket,
  cancelResellListing,
  getSoldedTicket
};
