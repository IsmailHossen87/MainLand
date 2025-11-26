import { Request, Response } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Metadata } from '../modules/stripeAccount/webhookHandler';

import { emailHelper } from '../../helpers/emailHelper';
import { emailTemplate } from '../../shared/emailTemplate';
import { Event } from '../modules/ORGANIZER/Event/Event.model';
import mongoose, { mongo, Types } from 'mongoose';
import { TicketPurchase } from '../modules/Ticket/ticket.model';
import { TransactionHistory } from '../modules/Payment/transactionHistory';

interface ITicket {
  ticketType: string;
  quantity: number;
}

const paymentSuccess = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Payment completed successfully',
  });
};
export const paymentCancel = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Payment completed successfully',
  });
};

// GENERATE ticket COde
const generateTicketName = (ticketType: string) => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${ticketType}-${random}`;
};

const handleEvent = async (session: Stripe.Checkout.Session) => {
  if (!session.metadata) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Metadata missing in session!");
  }

  const metadata = session.metadata as any;
  const { userId, eventId, attenEmail, fullName, attenPhone, discountCode } = metadata;
  const ownerId = new mongoose.Types.ObjectId(userId);

  // Parse tickets safely and ensure all price fields exist with defaults
  let allTickets: any[];
  try {
    allTickets = JSON.parse(metadata.tickets);
  } catch (error) {
    console.error('Error parsing tickets metadata:', error);
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid tickets data in metadata!");
  }

  // Validate and set defaults for each ticket
  allTickets = allTickets.map(ticket => {
    const price = typeof ticket.price === 'number' ? ticket.price : 0;
    const discountPerTicket = typeof ticket.discountPerTicket === 'number' ? ticket.discountPerTicket : 0;
    const finalPricePerTicket = typeof ticket.finalPricePerTicket === 'number'
      ? ticket.finalPricePerTicket
      : (price - discountPerTicket);

    return {
      ...ticket,
      price,
      discountPerTicket,
      finalPricePerTicket,
      quantity: ticket.quantity || 1,
    };
  });

  // Process each ticket
  for (const ticket of allTickets) {
    const { ticketType, quantity, price, discountPerTicket, finalPricePerTicket } = ticket;

    // Create N rows per quantity
    for (let i = 0; i < quantity; i++) {
      const ticketName = generateTicketName(ticketType);

      await TicketPurchase.create({
        eventId,
        ownerId,
        ticketName,
        attendeeInformation: { fullName, email: attenEmail, phone: attenPhone },
        ticketType,
        quantity: 1,
        originalPrice: price,
        discount: discountPerTicket,
        finalPrice: finalPricePerTicket,
        discountCode: discountCode || "",
        purchaseAmount: finalPricePerTicket,
      });
    }

    // Update stock & totalEarned for this ticket type
    await Event.findOneAndUpdate(
      { _id: eventId, "tickets.type": ticketType },
      {
        $inc: {
          "tickets.$.availableUnits": -quantity,
          totalEarned: finalPricePerTicket * quantity,
        },
      },
      { new: true, runValidators: true }
    );
  }

  // Calculate total amount safely
  const totalAmount = allTickets.reduce(
    (acc: number, t: any) => acc + (t.finalPricePerTicket * t.quantity),
    0
  );

  // Prepare email payload matching ITicket interface exactly
  const emailPayload = {
    name: fullName,
    email: attenEmail,
    totalTicket: allTickets.map(ticket => ({
      ticketType: ticket.ticketType,
      quantity: ticket.quantity,
      price: ticket.price, // Original price
      discountPerTicket: ticket.discountPerTicket > 0 ? ticket.discountPerTicket : undefined, // Only include if > 0
      finalPricePerTicket: ticket.finalPricePerTicket, // Final price after discount
      pricePerTicket: ticket.finalPricePerTicket, // For backward compatibility (same as finalPricePerTicket)
    })),
    totalAmount,
  };

  // Send Email
  try {
    const emailSend = emailTemplate.newTicketPurchaseEmail(emailPayload);
    await emailHelper.sendEmail(emailSend);
    console.log("✅ Email sent successfully to:", attenEmail);
  } catch (emailError) {
    console.error("❌ Error sending email:", emailError);
    // Don't throw - we don't want to fail the entire transaction if email fails
  }

  console.log("🎉 All tickets created successfully with correct per-ticket amounts!");
};;

const repurchaseTicket = async (session: Stripe.Checkout.Session) => {
  if (!session.metadata) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Metadata missing in session!");
  }
  const metadata = session.metadata as any;
  const { userId, email, fullName, phone, totalAmount, tickets } = metadata;

  let allTickets: any[];
  try {
    allTickets = JSON.parse(tickets);
  } catch (error) {
    console.error('Error parsing tickets metadata:', error);
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid tickets data in metadata!");
  }

  const newOwnerId = new mongoose.Types.ObjectId(userId);

  for (const ticketGroup of allTickets) {
    const { ticketIds, sellerId, ticketType, quantity, price } = ticketGroup;

    // Find tickets before updating to get eventId and sellAmount
    const ticketsToUpdate = await TicketPurchase.find({
      _id: { $in: ticketIds },
      ownerId: sellerId,
      ticketType: ticketType,
      status: "onsell",
    });

    if (ticketsToUpdate.length !== quantity) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        `Expected ${quantity} tickets but found ${ticketsToUpdate.length}`
      );
    }

    // Update the purchased tickets
    const updatedTickets = await TicketPurchase.updateMany(
      {
        _id: { $in: ticketIds },
        ownerId: sellerId,
        ticketType: ticketType,
        status: "onsell",
      },
      {
        $set: {
          ownerId: newOwnerId,
          status: "available",
          attendeeInformation: {
            fullName,
            email,
            phone,
          },
          purchaseAmount: price / quantity,
          purchaseDate: new Date(),
        },
      }
    );

    // Validate update
    if (updatedTickets.modifiedCount !== quantity) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        `Failed to update all ${ticketType} tickets. Expected ${quantity}, updated ${updatedTickets.modifiedCount}`
      );
    }

    // Create transaction history for each ticket (for SELLER)
    const transactionHistoryPromises = ticketsToUpdate.map((ticket) => {
      const purchaseAmount = ticket.purchaseAmount || 0; // Original purchase price
      const sellAmount = ticket.sellAmount || 0; // Sell price
      const earnedAmount = sellAmount - purchaseAmount; // Profit/Loss

      return TransactionHistory.create({
        userId: sellerId, // Seller's ID
        eventId: ticket.eventId,
        ticketId: ticket._id,
        purchaseAmount: purchaseAmount,
        sellAmount: sellAmount,
        earnedAmount: earnedAmount,
      });
    });

    await Promise.all(transactionHistoryPromises);

    console.log(`✅ Updated ${quantity} ${ticketType} ticket(s) and created transaction history for seller`);
  }

  // Prepare email payload for NEW BUYER
  const emailPayload = {
    name: fullName,
    email: email,
    totalTicket: allTickets.map(ticket => ({
      ticketType: ticket.ticketType,
      quantity: ticket.quantity,
      pricePerTicket: ticket.price / ticket.quantity,
      totalPrice: ticket.price,
    })),
    totalAmount: parseFloat(totalAmount),
  };

  // Send confirmation email to NEW BUYER
  try {
    const emailSend = emailTemplate.ticketPurchaseEmail(emailPayload);
    await emailHelper.sendEmail(emailSend);
    console.log("✅ Purchase confirmation email sent to:", email);
  } catch (emailError) {
    console.error("❌ Error sending email:", emailError);
  }
  console.log("🎉 All tickets transferred successfully to new owner!");
};



export const handlePayment = {
  paymentSuccess,
  paymentCancel,
  handleEvent,
  repurchaseTicket,
};
