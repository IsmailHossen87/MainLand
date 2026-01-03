"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePayment = exports.generateTicketName = exports.paymentCancel = void 0;
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const emailHelper_1 = require("../../helpers/emailHelper");
const emailTemplate_1 = require("../../shared/emailTemplate");
const Event_model_1 = require("../modules/ORGANIZER/Event/Event.model");
const mongoose_1 = __importDefault(require("mongoose"));
const ticket_model_1 = require("../modules/Ticket/ticket.model");
const transactionHistory_1 = require("../modules/Payment/transactionHistory");
const user_model_1 = require("../modules/user/user.model");
const paymentSuccess = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Payment completed successfully✅✅',
    });
};
const paymentCancel = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Payment completed successfully',
    });
};
exports.paymentCancel = paymentCancel;
// GENERATE ticket COde
const generateTicketName = (ticketType) => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${ticketType}-${random}`;
};
exports.generateTicketName = generateTicketName;
const handleEvent = (session, paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    if (!session.metadata) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Metadata missing in session!");
    }
    const metadata = session.metadata;
    const userId = metadata.userId;
    const organizerPayout = parseFloat(metadata.organizerPayout);
    const eventId = metadata.eventId;
    const fullName = metadata.fullName;
    const email = metadata.attenEmail;
    const phone = metadata.attenPhone;
    const mainlandFeePercentage = metadata.mainlandFeePercentage;
    const discountCode = metadata.discountCode || "";
    const mainlandFeeAmount = parseFloat(metadata.mainlandFeeAmount) || 0;
    const totalAmount = parseFloat(metadata.totalAmount) || 0;
    const ownerId = new mongoose_1.default.Types.ObjectId(userId);
    // ✅✅ IDEMPOTENCY CHECK - Prevent duplicate transactions
    const paymentIntentId = (paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.id) || session.payment_intent;
    if (!paymentIntentId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Payment intent ID missing!");
    }
    // Check if this payment has already been processed
    const existingTransaction = yield transactionHistory_1.TransactionHistory.findOne({
        paymentIntentId: paymentIntentId,
        type: "directPurchase",
    });
    if (existingTransaction) {
        console.log("⚠️ Payment already processed, skipping...");
        return;
    }
    let compressedTickets = [];
    try {
        compressedTickets = JSON.parse(metadata.tickets);
    }
    catch (_a) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid tickets data in metadata!");
    }
    // ✅ Get organizer ID from event
    const event = yield Event_model_1.Event.findById(eventId);
    const organizerId = event === null || event === void 0 ? void 0 : event.userId;
    const totalTickets = compressedTickets.reduce((sum, t) => sum + t.q, 0);
    yield user_model_1.User.findByIdAndUpdate(ownerId, { $inc: { totalTicketPurchase: totalTickets } });
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
    const allNewTickets = [];
    const updatedEventTickets = [];
    for (const ticket of allTickets) {
        for (let i = 0; i < ticket.quantity; i++) {
            allNewTickets.push({
                eventId,
                organizerId,
                ownerId,
                ticketName: (0, exports.generateTicketName)(ticket.ticketType),
                attendeeInformation: { fullName, email, phone },
                ticketType: ticket.ticketType,
                purchaseAmount: ticket.finalPricePerTicket + mainlandFeePerTicket,
                discount: ticket.discountPerTicket || 0,
                discountCode,
                mainLandFee: mainlandFeePerTicket,
                sellAmount: ticket.finalPricePerTicket + mainlandFeePerTicket,
                status: "available",
            });
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
        });
    }
    yield ticket_model_1.TicketPurchase.insertMany(allNewTickets);
    yield Event_model_1.Event.bulkWrite(updatedEventTickets);
    // Update organizer payout🐦‍🔥🐦‍🔥🐦‍🔥🐦‍🔥🐦‍🔥Banlance get
    yield user_model_1.User.findByIdAndUpdate(organizerId, {
        $inc: {
            pendingBalance: organizerPayout,
            totalEarnings: organizerPayout
        }
    });
    let payoutEligibleDate = null;
    if (event === null || event === void 0 ? void 0 : event.eventDate) {
        const eligibleDate = new Date(event.eventDate);
        eligibleDate.setDate(eligibleDate.getDate() + 15);
        payoutEligibleDate = eligibleDate;
    }
    // -----------------------------
    // ✅ ALWAYS CREATE NEW TRANSACTION - NO UPDATE
    // -----------------------------
    yield transactionHistory_1.TransactionHistory.create({
        userId: ownerId,
        eventId,
        organizerId,
        paymentIntentId: paymentIntentId,
        type: "directPurchase",
        purchaseAmount: totalAmount,
        organizerPayout: organizerPayout, // ✅ Organizer কত পাবে
        payoutStatus: 'pending', //new added
        mainLandFee: mainlandFeeAmount,
        sellAmount: 0,
        purchaseQuantity: totalQuantity,
        ticketInfo: allTickets.map((t) => ({
            ticketType: t.ticketType,
            quantity: t.quantity,
            ticketPrice: t.ticketPrice,
            commission: mainlandFeePercentage,
        })),
        adminPercentageTotal: Number(mainlandFeeAmount),
        revenue: 0,
        payoutEligibleDate: payoutEligibleDate,
    });
    // -----------------------------
    // Send Email
    // -----------------------------
    try {
        yield emailHelper_1.emailHelper.sendEmail(emailTemplate_1.emailTemplate.newTicketPurchaseEmail({
            name: fullName,
            email,
            totalAmount,
            totalTicket: allTickets,
            mainLandFee: mainlandFeeAmount,
        }));
        console.log("✅ Purchase confirmation email sent to:", email);
    }
    catch (error) {
        console.error("❌ Email failed:", error);
    }
    console.log("🎉 Ticket purchase completed successfully!");
});
const repurchaseTicket = (session, paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    if (!session.metadata) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Metadata missing in session!");
    }
    const metadata = session.metadata;
    const { userId, email, fullName, phone, totalAmount, ticketPrice, tickets, eventId, mfa: mainlandFeeAmount, mp: mainlandFeePercentage } = metadata;
    // ✅✅ IDEMPOTENCY CHECK - Prevent duplicate transactions
    const paymentIntentId = (paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.id) || session.payment_intent;
    if (!paymentIntentId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Payment intent ID missing!");
    }
    // Check if buyer's transaction already exists for this payment
    const existingBuyerTransaction = yield transactionHistory_1.TransactionHistory.findOne({
        paymentIntentId: paymentIntentId,
    });
    if (existingBuyerTransaction) {
        return; // Already processed, skip
    }
    let allTickets;
    // ✅ Get organizer ID from event
    const event = yield Event_model_1.Event.findById(eventId);
    const organizerId = event === null || event === void 0 ? void 0 : event.userId;
    try {
        allTickets = JSON.parse(tickets);
    }
    catch (error) {
        console.error('Error parsing tickets metadata:', error);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid tickets data in metadata!");
    }
    const newOwnerId = new mongoose_1.default.Types.ObjectId(userId);
    const totalBuyerPurchaseAmount = parseFloat(totalAmount);
    const totalBuyerQuantity = allTickets.reduce((sum, t) => sum + t.quantity, 0);
    let payoutEligibleDate = null;
    if (event === null || event === void 0 ? void 0 : event.eventDate) {
        const eligibleDate = new Date(event.eventDate);
        eligibleDate.setDate(eligibleDate.getDate() + 15);
        payoutEligibleDate = eligibleDate;
    }
    for (const ticketGroup of allTickets) {
        const { ticketIds, sellerId, ticketType, quantity, price, unitPrice, mainlandFeeForTicket, mainlandFeePerTicket } = ticketGroup;
        // Validate sellerId
        if (!sellerId) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Seller ID is missing in ticket data!");
        }
        // new Added 🐦‍🔥🐦‍🔥🐦‍🔥🐦‍🔥🐦‍🔥
        const sellerPayout = price - mainlandFeeForTicket;
        yield user_model_1.User.findByIdAndUpdate(sellerId, {
            $inc: {
                pendingBalance: sellerPayout
            }
        });
        // Convert string IDs to ObjectIds
        const ticketObjectIds = ticketIds.map((id) => new mongoose_1.default.Types.ObjectId(id));
        const sellerObjectId = new mongoose_1.default.Types.ObjectId(sellerId);
        // Find tickets before updating to verify availability and get original purchase amounts
        const ticketsToUpdate = yield ticket_model_1.TicketPurchase.find({
            _id: { $in: ticketObjectIds },
            ownerId: sellerObjectId,
            ticketType: ticketType,
            status: "onsell",
        });
        if (ticketsToUpdate.length !== quantity) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, `Expected ${quantity} tickets but found ${ticketsToUpdate.length}`);
        }
        // Get eventId from metadata or first ticket
        const ticketEventId = eventId || ticketsToUpdate[0].eventId;
        // ✅ Calculate original purchase amount (sum of all tickets' original purchase amounts)
        const originalPurchaseAmount = ticketsToUpdate.reduce((sum, ticket) => sum + (ticket.purchaseAmount || 0), 0);
        // ✅ Calculate per-ticket purchase amount (unit price + mainland fee per ticket)
        const purchaseAmountPerTicket = unitPrice + mainlandFeePerTicket;
        // Update the purchased tickets
        const updatedTickets = yield ticket_model_1.TicketPurchase.updateMany({
            _id: { $in: ticketObjectIds },
            ownerId: sellerObjectId,
            ticketType: ticketType,
            status: "onsell",
        }, {
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
                mainLandFee: mainlandFeePerTicket,
                resellerId: sellerObjectId,
                discount: 0,
                discountCode: "",
            },
        });
        // Validate update
        if (updatedTickets.modifiedCount !== quantity) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, `Failed to update all ${ticketType} tickets. Expected ${quantity}, updated ${updatedTickets.modifiedCount}`);
        }
        // ✅✅ CORRECT REVENUE CALCULATION
        // Revenue = What seller received (sell price) - What they originally paid
        const sellerRevenue = price - originalPurchaseAmount;
        // ✅ UPDATE SELLER'S PENDING BALANCE
        yield user_model_1.User.findByIdAndUpdate(sellerObjectId, {
            $inc: {
                pendingBalance: sellerPayout,
                totalEarnings: sellerPayout
            }
        });
        // ========================================
        // ✅ UPDATE SELLER'S directPurchase REVENUE
        // (Find the FIRST directPurchase for this seller & event)
        // ========================================
        const sellerTransaction = yield transactionHistory_1.TransactionHistory.findOne({
            userId: sellerObjectId,
            eventId: ticketEventId,
        }).sort({ createdAt: 1 });
        if (sellerTransaction) {
            sellerTransaction.organizerPayout = (sellerTransaction.organizerPayout || 0) + sellerPayout;
            yield sellerTransaction.save();
        }
        else {
            console.warn("⚠️ No directPurchase transaction found for seller. This shouldn't happen!");
        }
    }
    // ========================================
    // ✅ CREATE NEW directPurchase TRANSACTION FOR BUYER
    // ========================================
    yield transactionHistory_1.TransactionHistory.create({
        userId: newOwnerId,
        eventId,
        organizerId,
        sellerId: allTickets[0].sellerId,
        paymentIntentId: paymentIntentId,
        type: "resellPurchase",
        purchaseAmount: totalBuyerPurchaseAmount,
        mainLandFee: parseFloat(mainlandFeeAmount),
        sellAmount: 0, // Buyer hasn't sold yet
        purchaseQuantity: totalBuyerQuantity,
        ticketInfo: allTickets.map((t) => ({
            ticketType: t.ticketType,
            quantity: t.quantity,
            ticketPrice: t.unitPrice,
            commission: mainlandFeePercentage,
        })),
        organizerPayout: 0,
        payoutStatus: 'pending',
        payoutEligibleDate: payoutEligibleDate,
        adminPercentageTotal: parseFloat(mainlandFeeAmount),
        revenue: 0,
    });
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
                mainlandFeePerTicket: ticket.mainlandFeePerTicket,
                mainlandFeeTotal: ticket.mainlandFeeForTicket,
            })),
            ticketPrice: parseFloat(ticketPrice),
            mainlandFeeAmount: parseFloat(mainlandFeeAmount),
            totalAmount: parseFloat(totalAmount),
        };
        const emailSend = emailTemplate_1.emailTemplate.resaleTicketPurchaseEmail(emailPayload);
        yield emailHelper_1.emailHelper.sendEmail(emailSend);
        console.log("✅ Purchase confirmation email sent to:", email);
    }
    catch (emailError) {
        console.error("❌ Error sending email:", emailError);
    }
    console.log("🎉 All tickets transferred successfully to new owner!");
});
exports.handlePayment = {
    paymentSuccess,
    paymentCancel: exports.paymentCancel,
    handleEvent,
    repurchaseTicket,
};
