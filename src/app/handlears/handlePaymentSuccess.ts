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
  const mainlandFeePercentage = metadata.mainlandFeePercentage
  const discountCode = metadata.discountCode || "";
  const mainlandFeeAmount = parseFloat(metadata.mainlandFeeAmount) || 0;
  const totalAmount = parseFloat(metadata.totalAmount) || 0;
  const ownerId = new mongoose.Types.ObjectId(userId);
  // Safe parsing & expand compressed tickets
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
    ticketPrice: t.tp,
  }));


  const totalQuantity = allTickets.reduce((sum, t) => sum + t.quantity, 0);
  const mainlandFeePerTicket = totalQuantity > 0 ? mainlandFeeAmount / totalQuantity : 0;


  // Create individual ticket purchases

  const allNewTickets: any[] = [];
  const updatedEventTickets: any[] = [];

  for (const ticket of allTickets) {
    for (let i = 0; i < ticket.quantity; i++) {
      allNewTickets.push({
        eventId,
        ownerId,
        ticketName: generateTicketName(ticket.ticketType),
        attendeeInformation: { fullName, email, phone },
        ticketType: ticket.ticketType,
        purchaseAmount: ticket.finalPricePerTicket + mainlandFeePerTicket,
        discount: ticket.discountPerTicket || 0,
        discountCode,
        mainLandFee: mainlandFeePerTicket,
        sellAmount: ticket.finalPricePerTicket + mainlandFeePerTicket,
        status: "available",
      })
    }
    updatedEventTickets.push({
      updateOne: {
        filter: { _id: eventId, "tickets.type": ticket.ticketType },
        update: {
          $inc: {
            "tickets.$.availableUnits": -ticket.quantity,
            totalEarned: ticket.totalForThisTicket,
          },
          $addToSet: { "tickets.$.ticketBuyerId": ownerId }
        },
      },
    })
  }
  await TicketPurchase.insertMany(allNewTickets);
  await Event.bulkWrite(updatedEventTickets);

  // -----------------------------
  // Save transaction history - FOR USER
  // -----------------------------
  const existingUserTransaction = await TransactionHistory.findOne({
    userId: ownerId,
    eventId,
    type: "directPurchase",
  });

  if (existingUserTransaction) {
    existingUserTransaction.purchaseAmount += totalAmount;
    existingUserTransaction.ticketQuantity += totalQuantity;
    existingUserTransaction.adminPercentageTotal += mainlandFeeAmount;
    existingUserTransaction.mainLandFee += mainlandFeeAmount;
    for (const t of allTickets) {
      const existingType = existingUserTransaction.ticketInfo.find(
        (info) => info.ticketType === t.ticketType && info.ticketPrice === t.ticketPrice
      );

      if (existingType) {
        existingType.quantity += t.quantity;
      } else {
        existingUserTransaction.ticketInfo.push({
          ticketType: t.ticketType,
          quantity: t.quantity,
          ticketPrice: t.ticketPrice,
          commission: Number(mainlandFeePercentage),
        });
      }
    }
    await existingUserTransaction.save();
  } else {
    await TransactionHistory.create({
      userId: ownerId,
      eventId,
      type: "directPurchase",
      purchaseAmount: totalAmount,
      mainLandFee: mainlandFeeAmount,
      sellAmount: 0,
      ticketQuantity: totalQuantity,
      ticketInfo: allTickets.map((t) => ({
        ticketType: t.ticketType,
        quantity: t.quantity,
        ticketPrice: t.ticketPrice,
        commission: mainlandFeePercentage,
      })),
      adminPercentageTotal: Number(mainlandFeeAmount)
    })
  }

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
        mainLandFee: mainlandFeeAmount,
      })
    );
    console.log("✅ Purchase confirmation email sent to:", email);
  } catch (error) {
    console.error("❌ Email failed:", error);
  }

  console.log("🎉 Ticket purchase completed successfully!");
};



// Repurchase Ticket
const repurchaseTicket = async (session: Stripe.Checkout.Session) => {
  if (!session.metadata) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Metadata missing in session!");
  }

  const metadata = session.metadata as any;
  const { userId, email, fullName, phone, totalAmount, ticketPrice, tickets, eventId, mfa: mainlandFeeAmount, mp: mainlandFeePercentage } = metadata;

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
    const {
      ticketIds,
      sellerId,
      ticketType,
      quantity,
      price,
      unitPrice,
      mainlandFeeForTicket,
      mainlandFeePerTicket
    } = ticketGroup;

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

    // Get eventId from metadata or first ticket
    const ticketEventId = eventId || ticketsToUpdate[0].eventId;

    // ✅ Calculate per-ticket purchase amount (unit price + mainland fee per ticket)
    const purchaseAmountPerTicket = unitPrice + mainlandFeePerTicket;

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
          purchaseAmount: purchaseAmountPerTicket,
          sellAmount: purchaseAmountPerTicket,
          mainLandFee: mainlandFeePerTicket, // ✅ Mainland fee for this single ticket
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

    // ✅ Calculate earned amount for this ticket group
    const totalPriceWithFee = price + mainlandFeeForTicket;
    const earnedAmountForThisGroup = totalPriceWithFee - price;

    // Update transaction history
    const history = await TransactionHistory.findOne({
      userId: sellerObjectId,
      eventId: ticketEventId,
      type: 'resellPurchase',
    });

    if (history) {
      history.purchaseAmount += Number(totalPriceWithFee);
      history.sellAmount += Number(price);
      history.earnedAmount += Number(earnedAmountForThisGroup);
      history.ticketQuantity += Number(quantity);
      history.adminPercentageTotal += Number(mainlandFeeForTicket);
      history.mainLandFee += Number(mainlandFeeForTicket);

      const existingTicket = history.ticketInfo.find(
        (t: any) => t.ticketType === ticketType && t.ticketPrice === price
      );

      if (existingTicket) {
        existingTicket.quantity += Number(quantity);
      } else {
        history.ticketInfo.push({
          ticketType,
          quantity: Number(quantity),
          ticketPrice: Number(price),
          commission: Number(mainlandFeePercentage),
        });
      }

      await history.save();
    } else {
      await TransactionHistory.create({
        userId: sellerObjectId,
        resellerId: newOwnerId,
        eventId: ticketEventId,
        mainLandFee: parseFloat(mainlandFeeForTicket),
        type: "resellPurchase",
        purchaseAmount: Number(totalPriceWithFee),
        sellAmount: Number(price),
        earnedAmount: Number(earnedAmountForThisGroup),
        ticketQuantity: Number(quantity),
        adminPercentageTotal: Number(mainlandFeeForTicket),

        ticketInfo: [
          {
            ticketType,
            quantity: Number(quantity),
            ticketPrice: Number(price),
            commission: Number(mainlandFeePercentage),
          },
        ],
      });
    }






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
        mainlandFeePerTicket: ticket.mainlandFeePerTicket, // ✅ Include in email
        mainlandFeeTotal: ticket.mainlandFeeForTicket, // ✅ Total for this ticket type
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
