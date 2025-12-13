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
exports.TicketService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_model_1 = require("../user/user.model");
const ticket_model_1 = require("./ticket.model");
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const constrant_1 = require("../../../shared/constrant");
const mongoose_1 = __importDefault(require("mongoose"));
const ticket_interface_1 = require("./ticket.interface");
const transactionHistory_1 = require("../Payment/transactionHistory");
const Event_model_1 = require("../ORGANIZER/Event/Event.model");
const user_1 = require("../../../enums/user");
const getAllTicket = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // 2️⃣ Initialize base query
    const baseQuery = ticket_model_1.TicketPurchase.find({ ownerId: userId, }).populate('eventId', 'image eventName');
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, query);
    // 3️⃣ Apply queryBuilder methods
    const allTickets = queryBuilder
        .search(constrant_1.excludeField)
        .filter()
        .dateRange()
        .sort()
        .fields()
        .paginate();
    const [meta, data] = yield Promise.all([
        allTickets.getMeta(),
        allTickets.build(),
    ]);
    // 5️⃣ Return result
    return { meta, data };
});
// GetOneTicket
const getOneTicket = (userId, ticeketId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // 2️⃣ Initialize base query
    const baseQuery = ticket_model_1.TicketPurchase.find({ ownerId: userId, });
    const ticket = yield baseQuery.findOne({ _id: ticeketId }).populate('eventId', 'image eventName');
    if (!ticket) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Ticket not found');
    }
    // 5️⃣ Return result
    return ticket;
});
const getUniqueEvents = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const { status } = query;
    console.log("status", status);
    // 1️⃣ Check user exists
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // 2️⃣ Aggregation pipeline
    const baseQuery = ticket_model_1.TicketPurchase.aggregate([
        {
            $match: {
                ownerId: new mongoose_1.default.Types.ObjectId(userId),
                status: status || ticket_interface_1.ITicketStatus.onsell,
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
    const result = yield baseQuery.exec();
    return result;
});
const getSoldEvent = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ User exists check
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // 2️⃣ Aggregation pipeline
    const result = yield transactionHistory_1.TransactionHistory.aggregate([
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
});
const sellTicketInfoUsers = (userId, eventId, query) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Check user exists
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // 2️⃣ Base query (no status filtering here!)
    let baseQuery = ticket_model_1.TicketPurchase.find({
        ownerId: userId,
        eventId: eventId,
    });
    if (query.limit)
        delete query.limit;
    if (query.page)
        delete query.page;
    query.limit = 99999;
    // 3️⃣ Apply QueryBuilder safely
    const qb = new QueryBuilder_1.QueryBuilder(baseQuery, query)
        .search(["ticketName", "ticketType"])
        .filter()
        .dateRange()
        .sort()
        .fields()
        .paginate(); // safe now (limit=99999)
    // 4️⃣ Get filtered tickets
    const tickets = yield qb.build();
    console.log("Tickets after QueryBuilder:", tickets.length);
    if (!tickets || tickets.length === 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No tickets found for this event");
    }
    // 5️⃣ Group tickets by type & price
    const grouped = {};
    tickets.forEach((ticket) => {
        var _a;
        const type = String(ticket.ticketType || "Unknown");
        const sellPrice = (_a = ticket.sellAmount) !== null && _a !== void 0 ? _a : 0;
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
});
const sellTicketInfoUsersOnsell = (userId, eventId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // Base query
    const baseQuery = ticket_model_1.TicketPurchase.find({
        ownerId: userId,
        eventId: eventId,
    }).populate("ownerId", "name");
    ;
    // QueryBuilder
    const qb = new QueryBuilder_1.QueryBuilder(baseQuery, query)
        .search(["ticketName", "ticketType"])
        .filter()
        .dateRange()
        .sort()
        .fields()
        .paginate();
    const tickets = yield qb.build();
    if (!tickets || tickets.length === 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No tickets found for this event");
    }
    // Group by ticketType + purchaseAmount
    const grouped = {};
    tickets.forEach((ticket) => {
        var _a, _b;
        const type = String(ticket.ticketType || "Unknown");
        const price = Number(ticket.sellAmount || 0);
        // unique key: type + price
        const key = `${type}-${price}`;
        if (!grouped[key]) {
            grouped[key] = {
                type: type,
                price: price,
                sellerId: (_a = ticket.ownerId) === null || _a === void 0 ? void 0 : _a._id,
                ownerName: ((_b = ticket.ownerId) === null || _b === void 0 ? void 0 : _b.name) || "Unknown",
                availableUnits: 0,
            };
        }
        grouped[key].availableUnits += 1;
    });
    return Object.values(grouped);
});
const availableTypeHistory = (userId, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Check user exists
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // 2️⃣ Get all 'onsell' tickets for the event
    const tickets = yield ticket_model_1.TicketPurchase.find({
        eventId,
        status: ticket_interface_1.ITicketStatus.onsell
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
    const typeCountMap = {};
    tickets.forEach((ticket) => {
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
});
// 👊👊
const allOnsellTicketInfo = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // 1️⃣ Base query - sob tickets
    const baseQuery = ticket_model_1.TicketPurchase.find({
        status: ticket_interface_1.ITicketStatus.onsell,
    }).populate('ownerId', 'name');
    // 2️⃣ Apply QueryBuilder filters
    const qb = new QueryBuilder_1.QueryBuilder(baseQuery, query)
        .search(["ticketName", "ticketType"])
        .filter()
        .dateRange()
        .sort()
        .fields()
        .paginate();
    // 3️⃣ Execute filtered query
    const tickets = yield qb.build();
    if (!tickets || tickets.length === 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No tickets found");
    }
    // 4️⃣ Check if ticketType query exists
    const hasTicketTypeQuery = query.ticketType !== undefined;
    if (hasTicketTypeQuery) {
        // ✅ WITH ticketType query - Group by type AND owner
        const ticketsByTypeAndOwner = {};
        tickets.forEach((ticket) => {
            var _a, _b;
            const type = String(ticket.ticketType || "Unknown");
            const owner = String(((_a = ticket.ownerId) === null || _a === void 0 ? void 0 : _a._id) || "Unknown");
            const ownerName = ((_b = ticket.ownerId) === null || _b === void 0 ? void 0 : _b.name) || "Unknown";
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
        const result = [];
        Object.values(ticketsByTypeAndOwner).forEach(ownerGroup => {
            result.push(...Object.values(ownerGroup));
        });
        return result;
    }
    else {
        // ✅ WITHOUT ticketType query - Group by type only
        const ticketsByType = {};
        tickets.forEach((ticket) => {
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
});
// ResellTicket
const resellTicket = (userId, eventId, tickets) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Check user exists
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const results = [];
    let totalSellAmount = 0;
    // 2️⃣ Loop through each ticket type
    for (const ticket of tickets) {
        const { ticketType, quantity, resellAmount } = ticket;
        // 3️⃣ Find available tickets
        const availableTickets = yield ticket_model_1.TicketPurchase.find({
            ownerId: userId,
            eventId: eventId,
            ticketType: ticketType,
            status: ticket_interface_1.ITicketStatus.available
        }).limit(quantity);
        // 4️⃣ Check if enough tickets available
        if (availableTickets.length < quantity) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Not enough tickets available. You have ${availableTickets.length} ${ticketType} tickets, but requested ${quantity}`);
        }
        // 5️⃣ Update tickets status to 'onsell' and set resell amount
        const ticketIds = availableTickets.map(t => t._id);
        const updatedTickets = yield ticket_model_1.TicketPurchase.updateMany({ _id: { $in: ticketIds } }, {
            $set: {
                status: ticket_interface_1.ITicketStatus.onsell,
                sellAmount: resellAmount
            }
        });
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
    yield user.updateOne({
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
});
// withdrawPro
const withdrawPro = (userId, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1️⃣ Check user exists
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // 2️⃣ Find resold (live) tickets to withdraw
    const liveTickets = yield ticket_model_1.TicketPurchase.find({
        ownerId: userId,
        eventId,
        status: ticket_interface_1.ITicketStatus.onsell,
    })
        .sort({ createdAt: 1 });
    // 4️⃣ Update selected tickets → available
    const ticketIds = liveTickets.map((ticket) => ticket._id);
    yield ticket_model_1.TicketPurchase.updateMany({ _id: { $in: ticketIds } }, {
        $set: {
            status: ticket_interface_1.ITicketStatus.available,
            sellAmount: 0,
            totalEarned: 0,
            discount: 0,
        },
    });
    return {
        success: true,
        message: `Tickets withdrawn successfully.`,
    };
});
const soldTicket = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = new mongoose_1.default.Types.ObjectId(userId);
    // 1️⃣ Check user exists
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const transactions = yield transactionHistory_1.TransactionHistory.find({ resellerId: ownerId }).populate('eventId', 'name image').populate('ticketId', ' ticketType')
        .sort({ createdAt: -1 })
        .limit(10);
    if (!transactions) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No transactions found");
    }
    return transactions;
});
const ticketExpired = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const ownerId = new mongoose_1.default.Types.ObjectId(userId);
    const user = yield user_model_1.User.findById(ownerId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tickets = yield ticket_model_1.TicketPurchase.find({ ownerId })
        .populate("eventId", "eventName eventDate image streetAddress isFreeEvent ")
        .lean();
    const expiredTickets = tickets.filter((ticket) => {
        var _a;
        if ((_a = ticket.eventId) === null || _a === void 0 ? void 0 : _a.eventDate) {
            const eventDate = new Date(ticket.eventId.eventDate);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate < today;
        }
        return false;
    });
    // ⭐ Unique by eventId
    const uniqueExpired = [
        ...new Map(expiredTickets.map((item) => [item.eventId._id.toString(), item])).values(),
    ];
    console.log("uniqueExpired", uniqueExpired);
    // ⭐ Return formatted response like sold ticket API
    const formattedResponse = uniqueExpired.map((ticket) => {
        var _a, _b, _c, _d, _e, _f;
        return ({
            ticketId: ticket._id || null,
            purchaseAmount: ticket.purchaseAmount || 0,
            sellAmount: ticket.sellAmount || 0,
            type: "expired",
            eventId: ticket.eventId._id,
            eventName: (_a = ticket === null || ticket === void 0 ? void 0 : ticket.eventId) === null || _a === void 0 ? void 0 : _a.eventName,
            eventDate: (_b = ticket === null || ticket === void 0 ? void 0 : ticket.eventId) === null || _b === void 0 ? void 0 : _b.eventDate,
            image: (_c = ticket === null || ticket === void 0 ? void 0 : ticket.eventId) === null || _c === void 0 ? void 0 : _c.image,
            streetAddress: ((_d = ticket === null || ticket === void 0 ? void 0 : ticket.eventId) === null || _d === void 0 ? void 0 : _d.streetAddress) || null,
            isFreeEvent: (_f = (_e = ticket === null || ticket === void 0 ? void 0 : ticket.eventId) === null || _e === void 0 ? void 0 : _e.isFreeEvent) !== null && _f !== void 0 ? _f : false,
        });
    });
    return formattedResponse;
});
// EVENT SUMMARY
const eventSummary = (_a) => __awaiter(void 0, [_a], void 0, function* ({ userId, sellerType, ticketType, eventId }) {
    const ownerId = new mongoose_1.default.Types.ObjectId(userId);
    const user = yield user_model_1.User.findById(ownerId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    let allEventsTicketHistory;
    if (sellerType === 'organizer') {
        allEventsTicketHistory = yield Event_model_1.Event.findById(eventId).select('tickets.availableUnits tickets.type tickets.price -_id');
        if (!allEventsTicketHistory) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Event not found");
        }
        return allEventsTicketHistory;
    }
    if (sellerType === 'user') {
        allEventsTicketHistory = yield ticket_model_1.TicketPurchase.find({ ownerId: ownerId }).select('tickets.availableUnits tickets.type tickets.price -_id');
        if (!allEventsTicketHistory) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Event not found");
        }
        return allEventsTicketHistory;
    }
    return allEventsTicketHistory;
});
const promocode = (userId, id, code) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // User check
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // Event find
    const event = yield Event_model_1.Event.findOne({
        _id: id,
        "discountCodes.code": code
    });
    if (!event) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Promo code not found or invalid");
    }
    // 🚀 Safely handle undefined discountCodes
    const discountCode = (_a = event.discountCodes) === null || _a === void 0 ? void 0 : _a.find((dc) => dc.code === code);
    if (!discountCode) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Discount code not found");
    }
    return discountCode;
});
// BAR-CODE generate
const checkEvent = (userId, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const tickets = yield Event_model_1.Event.findOne({ eventCode: eventId, userId: user._id });
    if (!tickets) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Event not found");
    }
    if (tickets) {
        return true;
    }
    return false;
});
const soldTicketHistory = (userId, eventId, expired) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const tickets = yield transactionHistory_1.TransactionHistory.findOne({
        eventId: new mongoose_1.default.Types.ObjectId(eventId),
        userId: user._id,
    }).populate("eventId", "eventName eventDate");
    if (!tickets) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Ticket not found");
    }
    const eventDate = new Date(tickets.eventId.eventDate);
    const now = new Date();
    const isExpiredEvent = eventDate < now;
    // ----------------------------------------------------
    // CASE 1: expired=true but event NOT expired → return NO DATA
    // ----------------------------------------------------
    if (expired === "true" && !isExpiredEvent) {
        return {
            eventName: ((_a = tickets.eventId) === null || _a === void 0 ? void 0 : _a.eventName) || "",
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
    const typeCount = {};
    tickets.ticketInfo.forEach((t) => {
        typeCount[t.ticketType] = (typeCount[t.ticketType] || 0) + 1;
    });
    const typeSummary = Object.entries(typeCount).map(([ticketType, count]) => ({
        ticketType,
        count,
    }));
    return {
        eventName: ((_b = tickets.eventId) === null || _b === void 0 ? void 0 : _b.eventName) || "",
        expired: isExpiredEvent,
        summary: {
            totalSellAmount: tickets.purchaseAmount,
            totalMainlandFee: tickets.mainLandFee,
            types: typeSummary,
        },
        details: tickets.ticketInfo.map((t) => ({
            ticketType: t.ticketType,
            quantity: t.quantity,
            price: t.ticketPrice,
            commission: t.commission,
        })),
    };
});
const historyTickets = (userId, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (user.role === user_1.USER_ROLES.USER) {
        const tickets = yield ticket_model_1.TicketPurchase.find({ resellerId: user._id, eventId });
        if (!tickets) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Ticket not found");
        }
        return tickets;
    }
});
exports.TicketService = {
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
