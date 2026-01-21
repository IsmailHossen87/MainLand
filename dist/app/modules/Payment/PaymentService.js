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
exports.createPaymentService = void 0;
const stripe_config_1 = __importDefault(require("../../config/stripe.config"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const Event_model_1 = require("../ORGANIZER/Event/Event.model");
const user_model_1 = require("../user/user.model");
const ticket_model_1 = require("../Ticket/ticket.model");
const mongoose_1 = __importDefault(require("mongoose"));
const createPaymentIntentEvent = (eventId, userInfo) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { fullName, email, phone, tickets, discountCode, userId } = userInfo;
    // 1️⃣ Event check
    const event = yield Event_model_1.Event.findById(eventId);
    if (!event) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found!');
    }
    // 2️⃣ Event Status check
    if (event.EventStatus === 'UnderReview' || event.EventStatus === 'Rejected') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This event is not available for ticket purchase at the moment!');
    }
    // 3️⃣ Event Date check
    if (event.eventDate && new Date(event.eventDate) < new Date()) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot purchase tickets for past events!');
    }
    // 4️⃣ Ticket Sale Period check
    const now = new Date();
    if (event.ticketSaleStart && new Date(event.ticketSaleStart) > now) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Ticket sales have not started yet!');
    }
    if (event.preSaleStart && event.preSaleEnd) {
        const preSaleStartDate = new Date(event.preSaleStart);
        if (now < preSaleStartDate) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Presale has not started yet!');
        }
    }
    // 5️⃣ Free Event check
    if (event.isFreeEvent) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This is a free event. Payment is not required!');
    }
    // 6️⃣ Tickets validation
    if (!tickets || tickets.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please select at least one ticket!');
    }
    let totalDiscountedTicketPrice = 0;
    const updatedTickets = [];
    for (const selected of tickets) {
        if (selected.quantity <= 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Ticket quantity must be greater than zero!');
        }
        const eventTicket = (_a = event.tickets) === null || _a === void 0 ? void 0 : _a.find(t => t.type === selected.ticketType);
        if (!eventTicket) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `${selected.ticketType} ticket not found for this event!`);
        }
        if (eventTicket.availableUnits < selected.quantity) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Not enough ${selected.ticketType} tickets available! Only ${eventTicket.availableUnits} left.`);
        }
        const price = eventTicket.price;
        let discountPerTicket = 0;
        // Apply discount
        if (discountCode) {
            const validCode = (_b = event.discountCodes) === null || _b === void 0 ? void 0 : _b.find(d => d.code === discountCode);
            if (!validCode) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Coupon code!');
            }
            if (validCode.expireDate && new Date(validCode.expireDate).getTime() < Date.now()) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This Coupon code has expired!');
            }
            discountPerTicket = (price * validCode.percentage) / 100;
        }
        const discountedPricePerTicket = price - discountPerTicket;
        const totalForThisTicket = discountedPricePerTicket * selected.quantity;
        totalDiscountedTicketPrice += totalForThisTicket;
        updatedTickets.push({
            t: selected.ticketType,
            q: selected.quantity,
            a: eventTicket.availableUnits,
            p: price,
            d: discountPerTicket,
            f: discountedPricePerTicket,
            tot: totalForThisTicket,
            tp: price,
        });
    }
    // ✅ Mainland Fee Calculation
    const mainLandFee = yield user_model_1.MainlandFee.findOne();
    const mainlandFeePercentage = (mainLandFee === null || mainLandFee === void 0 ? void 0 : mainLandFee.mainlandFee) || 0;
    // Fee is % of total discounted ticket price
    const feePercentage = Math.min(mainlandFeePercentage, 100);
    const mainlandFeeAmount = (totalDiscountedTicketPrice * feePercentage) / 100;
    // Total Amount = discounted tickets + mainland fee
    const totalAmount = totalDiscountedTicketPrice + mainlandFeeAmount;
    if (totalAmount <= 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Total amount must be greater than zero.');
    }
    // Validate user
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not available');
    }
    // Create Stripe customer
    const stripeCustomer = yield stripe_config_1.default.customers.create({
        name: user.name,
        email: user.email,
    });
    // Create Stripe Checkout session
    const stripeSession = yield stripe_config_1.default.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer: stripeCustomer.id,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: { name: `Tickets for ${event.eventName}` },
                    unit_amount: Math.round(totalAmount * 100),
                },
                quantity: 1,
            },
        ],
        metadata: {
            eventId: eventId.toString(),
            userId: user._id.toString(),
            fullName,
            attenEmail: email,
            attenPhone: phone,
            tickets: JSON.stringify(updatedTickets),
            totalAmount: totalAmount.toFixed(2),
            ticketPrice: totalDiscountedTicketPrice.toFixed(2),
            mainlandFeePercentage: feePercentage.toString(),
            mainlandFeeAmount: mainlandFeeAmount.toFixed(2),
            discountCode: discountCode || '',
            organizerPayout: (totalDiscountedTicketPrice).toFixed(2),
            type: 'directPurchase',
        },
        success_url: `${config_1.default.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config_1.default.stripe.cancel_url}?purchase_id=cancelled`,
    });
    return { url: stripeSession.url, sessionId: stripeSession.id };
});
const BuyTicket = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { fullName, email, phone, tickets, userId, eventId } = payload;
    // 1. Validate user
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not available");
    }
    // 2. Validate event exists
    const event = yield Event_model_1.Event.findById(eventId);
    if (!event) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Event not found");
    }
    // 3. Validate tickets array
    if (!tickets || tickets.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No tickets selected");
    }
    const mainLandFee = yield user_model_1.MainlandFee.findOne();
    const mainlandFeePercentage = (mainLandFee === null || mainLandFee === void 0 ? void 0 : mainLandFee.mainlandFee) || 0;
    const feePercentage = Math.min(mainlandFeePercentage, 100);
    let totalTicketPrice = 0;
    let totalMainlandFee = 0;
    const ticketDetails = [];
    // 4. Process each selected ticket type
    for (const ticket of tickets) {
        const { ticketType, quantity, amount, sellerId } = ticket;
        // Validate required fields
        if (!ticketType || !quantity || !amount || !sellerId) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Missing required ticket information (ticketType, quantity, amount, or sellerId)");
        }
        if (quantity <= 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Ticket quantity must be greater than zero");
        }
        // Convert sellerId to ObjectId
        const sellerObjectId = new mongoose_1.default.Types.ObjectId(sellerId);
        // 5. Fetch available tickets for seller
        const availableTickets = yield ticket_model_1.TicketPurchase.find({
            ownerId: sellerObjectId,
            ticketType,
            eventId,
            status: "onsell",
            sellAmount: Number(amount)
        }).sort({ createdAt: 1 }); // First come, first served
        // 6. Validate quantity
        if (availableTickets.length === 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `No ${ticketType} tickets available at $${amount} from this seller`);
        }
        if (availableTickets.length < quantity) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Only ${availableTickets.length} ${ticketType} ticket(s) available at $${amount}, but ${quantity} requested`);
        }
        // 7. Select the required number of tickets
        const selectedTickets = availableTickets.slice(0, quantity);
        const ticketPrice = quantity * Number(amount);
        // ✅ Calculate mainland fee for THIS ticket type
        const mainlandFeeForThisTicket = (ticketPrice * feePercentage) / 100;
        totalTicketPrice += ticketPrice;
        totalMainlandFee += mainlandFeeForThisTicket;
        ticketDetails.push({
            sellerId: sellerObjectId.toString(),
            ticketType,
            quantity,
            price: ticketPrice,
            ticketIds: selectedTickets.map(t => t._id.toString()),
            unitPrice: Number(amount),
            mainlandFeeForTicket: mainlandFeeForThisTicket,
            mainlandFeePerTicket: mainlandFeeForThisTicket / quantity
        });
    }
    const totalAmount = totalTicketPrice + totalMainlandFee;
    // 9. Validate total amount
    if (totalAmount <= 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Total amount must be greater than zero");
    }
    const metadata = {
        userId: user._id.toString(),
        fullName,
        email,
        phone,
        tickets: JSON.stringify(ticketDetails),
        totalAmount: totalAmount.toFixed(2),
        ticketPrice: totalTicketPrice.toFixed(2),
        mp: feePercentage.toString(),
        mfa: totalMainlandFee.toFixed(2), // ✅ Total mainland fee
        type: "resellPurchase",
        eventId: eventId.toString()
    };
    // 10. Create Stripe customer
    const stripeCustomer = yield stripe_config_1.default.customers.create({
        name: user.name,
        email: user.email,
    });
    // 11. Create checkout session
    const stripeSession = yield stripe_config_1.default.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer: stripeCustomer.id,
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Tickets for ${event.eventName || 'Event'}`
                    },
                    unit_amount: Math.round(totalAmount * 100)
                },
                quantity: 1
            }
        ],
        metadata,
        // metadata: {
        //   userId: user._id.toString(),
        //   fullName,
        //   email,
        //   phone,
        //   tickets: JSON.stringify(ticketDetails),
        //   totalAmount: totalAmount.toFixed(2),
        //   ticketPrice: totalTicketPrice.toFixed(2),
        //   mp: feePercentage.toString(),
        //   mfa: totalMainlandFee.toFixed(2), // ✅ Total mainland fee
        //   type: "resellPurchase",
        //   eventId: eventId.toString()
        // },
        success_url: `${config_1.default.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config_1.default.stripe.cancel_url}`
    });
    return {
        sessionId: stripeSession.id,
        url: stripeSession.url,
        totalAmount: totalAmount,
        ticketPrice: totalTicketPrice,
        mainlandFeeAmount: totalMainlandFee
    };
});
exports.createPaymentService = {
    createPaymentIntentEvent,
    BuyTicket,
};
