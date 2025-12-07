import { Request, Response } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';


import { emailHelper } from '../../helpers/emailHelper';
import { emailTemplate } from '../../shared/emailTemplate';
import { Event } from '../modules/ORGANIZER/Event/Event.model';
import mongoose, { mongo, Types } from 'mongoose';
import { TicketPurchase } from '../modules/Ticket/ticket.model';
import { TransactionHistory } from '../modules/Payment/transactionHistory';


const paymentSuccess = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Payment completed successfully✅✅',
  });
};

export const paymentCancel = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Payment completed successfully',
  });
};

// GENERATE ticket COde
export const generateTicketName = (ticketType: string) => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${ticketType}-${random}`;
};


const handleEvent = async (session: Stripe.Checkout.Session) => {
  if (!session.metadata) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Metadata missing in session!");
  }

  const metadata = session.metadata as any;

  const userId = metadata.userId;
  const eventId = metadata.eventId;
  const fullName = metadata.fullName;
  const email = metadata.attenEmail;
  const phone = metadata.attenPhone;
  const discountCode = metadata.discountCode || "";
  const mainlandFeeAmount = Number(metadata.mainlandFeeAmount);
  const Amount = Number(metadata.totalAmount);
  const ownerId = new mongoose.Types.ObjectId(userId);

  // -----------------------------
  // Safe parsing & expand compressed tickets
  // -----------------------------
  let compressedTickets: any[] = [];

  try {
    compressedTickets = JSON.parse(metadata.tickets);
  } catch {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid tickets data in metadata!");
  }

  const allTickets = compressedTickets.map(t => ({
    ticketType: t.t,
    quantity: t.q,
    availableUnits: t.a,
    price: t.p,
    discountPerTicket: t.d,
    finalPricePerTicket: t.f,
    totalForThisTicket: t.tot,
  }));

  // -----------------------------
  // Create individual ticket purchases
  // -----------------------------
  const createdTicketIds: mongoose.Types.ObjectId[] = [];

  for (const ticket of allTickets) {
    for (let i = 0; i < ticket.quantity; i++) {
      const newTicket = await TicketPurchase.create({
        eventId,
        ownerId: new mongoose.Types.ObjectId(userId),
        ticketName: generateTicketName(ticket.ticketType),
        attendeeInformation: { fullName, email, phone },
        ticketType: ticket.ticketType,
        purchaseAmount: Amount,
        discount: ticket.discountPerTicket,
        discountCode,
        mainLandFee: mainlandFeeAmount,
        sellAmount: Amount,
        status: "available",
      });
      createdTicketIds.push(newTicket._id);
    }

    // -----------------------------
    // ❗ FIX: decrease availableUnits by actual quantity
    // -----------------------------
    await Event.updateOne(
      {
        _id: eventId,
        "tickets.type": ticket.ticketType,   // <-- CORRECTED FIELD
      },
      {
        $inc: {
          "tickets.$.availableUnits": -ticket.quantity,
        },
      }
    );
  }

  // -----------------------------
  // Calculate total amount
  // -----------------------------
  const totalAmount = allTickets.reduce(
    (sum, t) => sum + t.totalForThisTicket,
    0
  );

  // -----------------------------
  // Save transaction history
  // -----------------------------
  await TransactionHistory.create({
    userId: ownerId,
    eventId,
    type: "directPurchase",
    purchaseAmount: totalAmount,
    ticketId: createdTicketIds[0],
    sellAmount: 0,
    ticketQuantity: allTickets.reduce((sum, t) => sum + t.quantity, 0),
  });

  // -----------------------------
  // Send Email
  // -----------------------------
  try {
    await emailHelper.sendEmail(
      emailTemplate.newTicketPurchaseEmail({
        name: fullName,
        email,
        totalAmount,
        totalTicket: allTickets,
      })
    );
  } catch (error) {
    console.error("Email failed:", error);
  }

  console.log("🎉 Ticket purchase completed successfully!");
};


const repurchaseTicket = async (session: Stripe.Checkout.Session) => {
  if (!session.metadata) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Metadata missing in session!");
  }

  console.log(session.metadata);

  const metadata = session.metadata as any;
  const { userId, email, fullName, phone, totalAmount, ticketPrice, tickets, eventId, mainlandFeeAmount } = metadata;
  console.log("meeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", metadata);

  let allTickets: any[];

  try {
    allTickets = JSON.parse(tickets);
    console.log("🚀 ~ repurchaseTicket ~ allTickets:", allTickets);
  } catch (error) {
    console.error('Error parsing tickets metadata:', error);
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid tickets data in metadata!");
  }

  const newOwnerId = new mongoose.Types.ObjectId(userId);

  for (const ticketGroup of allTickets) {
    const { ticketIds, sellerId, ticketType, quantity, price, unitPrice } = ticketGroup;


    // Validate sellerId
    if (!sellerId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Seller ID is missing in ticket data!");
    }

    // Convert string IDs to ObjectIds
    const ticketObjectIds = ticketIds.map((id: string) => new mongoose.Types.ObjectId(id));
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Find tickets before updating to verify availability
    const ticketsToUpdate = await TicketPurchase.find({
      _id: { $in: ticketObjectIds },
      ownerId: sellerObjectId,
      ticketType: ticketType,
      status: "onsell",
    });

    if (ticketsToUpdate.length !== quantity) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        `Expected ${quantity} tickets but found ${ticketsToUpdate.length}`
      );
    }

    // Calculate totals for this ticket group
    const totalPurchaseAmount = ticketsToUpdate.reduce(
      (sum, ticket) => sum + (ticket.purchaseAmount || 0),
      0
    );
    const totalSellAmount = price;
    const totalEarnedAmount = totalSellAmount - totalPurchaseAmount;

    // Get eventId from metadata or first ticket
    const ticketEventId = eventId || ticketsToUpdate[0].eventId;

    // Update the purchased tickets
    const updatedTickets = await TicketPurchase.updateMany(
      {
        _id: { $in: ticketObjectIds },
        ownerId: sellerObjectId,
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
          purchaseAmount: unitPrice,
          sellAmount: price,
          mainLandFee: parseFloat(mainlandFeeAmount) || 0,
          resellerId: sellerObjectId,
          discount: 0,
          discountCode: "",
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
    await Event.updateOne({
      _id: ticketEventId,
      "tickets._id": { $in: ticketObjectIds },
    }, {
      $inc: {
        "tickets.$.availableUnits": -quantity,
      },
    });

    // Create transaction history for SELLER
    await TransactionHistory.create({
      userId: sellerObjectId,
      resellerId: newOwnerId,
      eventId: ticketEventId,
      ticketId: ticketObjectIds[0], // Use ObjectId, not array
      type: 'resellPurchase',
      purchaseAmount: totalPurchaseAmount,
      sellAmount: totalSellAmount,
      earnedAmount: totalEarnedAmount,
      ticketQuantity: Number(quantity),
    });

    console.log(`✅ Processed ${quantity} ${ticketType} ticket(s) for seller ${sellerId}`);
  }

  // Send confirmation email to NEW BUYER
  try {
    const emailPayload = {
      name: fullName,
      email: email,
      totalTicket: allTickets.map(ticket => ({
        ticketType: ticket.ticketType,
        quantity: ticket.quantity,
        pricePerTicket: ticket.unitPrice,
        totalPrice: ticket.price,
      })),
      ticketPrice: parseFloat(ticketPrice),
      mainlandFeeAmount: parseFloat(mainlandFeeAmount),
      totalAmount: parseFloat(totalAmount),
    };

    const emailSend = emailTemplate.resaleTicketPurchaseEmail(emailPayload);
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
