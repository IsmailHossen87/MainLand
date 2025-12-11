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
exports.ActionService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../../errors/ApiError"));
const user_model_1 = require("../../user/user.model");
const Event_model_1 = require("../../ORGANIZER/Event/Event.model");
const user_1 = require("../../../../enums/user");
const generateOTP_1 = require("../../../../util/generateOTP");
const QueryBuilder_1 = require("../../../builder/QueryBuilder");
const ticket_model_1 = require("../../Ticket/ticket.model");
const transactionHistory_1 = require("../../Payment/transactionHistory");
const constrant_1 = require("../../../../shared/constrant");
const notification_model_1 = require("../../Notification/notification.model");
const statusChange = (userId, eventId) => __awaiter(void 0, void 0, void 0, function* () {
    // ✅ Check user
    const isExistUser = yield user_model_1.User.findById(userId);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "User doesn't exist!");
    }
    if (isExistUser.role !== user_1.USER_ROLES.ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admin can update it");
    }
    // ✅ Check event
    const event = yield Event_model_1.Event.findById(eventId);
    if (!event) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Event doesn't exist!");
    }
    const generateEvent = (0, generateOTP_1.generateEventCode)(event._id.toString());
    // ✅ Determine new status
    let newStatus;
    switch (event.EventStatus) {
        case "UnderReview":
            newStatus = "Live";
            break;
        case "Live":
            newStatus = "UnderReview";
            break;
        default:
            newStatus = "UnderReview";
            break;
    }
    // ✅ Update the correct field
    const updatedEvent = yield Event_model_1.Event.findByIdAndUpdate(eventId, {
        EventStatus: newStatus,
        eventCode: generateEvent,
    }, { new: true, runValidators: true });
    return updatedEvent;
});
const blockUser = (userId, adminInfo) => __awaiter(void 0, void 0, void 0, function* () {
    if (adminInfo.role !== user_1.USER_ROLES.ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admin can update it");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User doesn't exist!");
    }
    let newStatus;
    switch (user.status) {
        case "Active":
            newStatus = "Blocked";
            break;
        case "Blocked":
            newStatus = "Active";
            break;
        default:
            newStatus = "Active";
            break;
    }
    const updateUser = yield user_model_1.User.findByIdAndUpdate(userId, { status: newStatus }, { new: true });
    return { user: updateUser, message: newStatus };
});
// Dashboard
const DashBoard = (user, query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = user.id;
    if (user.role !== user_1.USER_ROLES.ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admin can access it");
    }
    // 📊 Overview Stats
    const totalUsers = yield user_model_1.User.countDocuments({
        role: { $in: [user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER] }
    });
    const totalSoldTickets = yield ticket_model_1.TicketPurchase.countDocuments();
    const totalCategories = yield Event_model_1.Category.countDocuments();
    const totalRevenue = yield Event_model_1.Event.aggregate([
        { $group: { _id: null, total: { $sum: "$totalEarned" } } }
    ]);
    // 📈 Income Ratio (Monthly data for chart)
    const year = query.year ? parseInt(query.year) : new Date().getFullYear();
    const incomeRatio = yield transactionHistory_1.TransactionHistory.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: "$createdAt" },
                totalAmount: { $sum: "$sellAmount" }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    // Format income ratio data for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedIncomeRatio = monthNames.map((month, index) => {
        const monthData = incomeRatio.find(item => item._id === index + 1);
        return {
            month,
            amount: monthData ? monthData.totalAmount : 0
        };
    });
    // 🎟️ Tickets Selling (Donut Chart Data)
    const month = query.month || new Date().toLocaleString('default', { month: 'long' });
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const ticketsSelling = yield transactionHistory_1.TransactionHistory.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(year, monthIndex, 1),
                    $lt: new Date(year, monthIndex + 1, 1)
                }
            }
        },
        {
            $group: {
                _id: "$type",
                total: { $sum: "$sellAmount" },
                count: { $sum: 1 }
            }
        }
    ]);
    const directSales = ticketsSelling.find(item => item._id === "directPurchase") || { total: 0, count: 0 };
    const resales = ticketsSelling.find(item => item._id === "resellPurchase") || { total: 0, count: 0 };
    // 🎯 Final Response Structure (matching UI)
    const dashboardData = {
        overview: {
            totalUser: totalUsers,
            totalSoldTickets: totalSoldTickets,
            categories: totalCategories,
            totalRevenue: ((_a = totalRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0
        },
        incomeRatio: {
            year: year,
            data: formattedIncomeRatio
        },
        ticketsSelling: {
            month: month,
            directSales: {
                amount: directSales.total,
                count: directSales.count
            },
            resales: {
                amount: resales.total,
                count: resales.count
            }
        }
    };
    return dashboardData;
});
// All User
const AllTicketBuyerUser = (user, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (user.role !== user_1.USER_ROLES.ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admin can access it");
    }
    // ✅ Get unique user IDs who bought tickets
    const uniqueUserIds = yield ticket_model_1.TicketPurchase.distinct("ownerId");
    // ✅ Create query (don't execute with await yet)
    const userQuery = user_model_1.User.find({
        _id: { $in: uniqueUserIds },
        role: { $in: [user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER] }
    }).select('name email role createdAt personalInfo address');
    // ✅ Pass the query object to QueryBuilder
    const queryBuilder = new QueryBuilder_1.QueryBuilder(userQuery, query);
    const [meta, data] = yield Promise.all([
        queryBuilder.getMeta(),
        queryBuilder.build(),
    ]);
    return { meta, data };
});
// // ticket Activity
const ticketActivity = (user, userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (user.role !== user_1.USER_ROLES.ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admin can access it");
    }
    // ❌ Don't spread ...query here
    const baseQuery = transactionHistory_1.TransactionHistory.find({ userId: userId })
        .select('ticketId ownerId createdAt purchaseAmount sellAmount earnedAmount ticketQuantity');
    console.log(baseQuery);
    // ✅ Pass query to QueryBuilder - it will handle the query params
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, query);
    const allHistory = queryBuilder
        .search(constrant_1.excludeField)
        .filter() // Add this to handle filtering
        .sort();
    console.log('Query Builder:', allHistory);
    const [meta, data] = yield Promise.all([
        allHistory.getMeta(),
        allHistory.build(),
    ]);
    return { meta, data };
});
const accountDeleteHistory = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (user.role !== user_1.USER_ROLES.ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admin can access it");
    }
    const accountDeleteHistory = yield user_model_1.isDeleted.find().sort({ createdAt: -1 });
    return accountDeleteHistory;
});
const allNotification = (user, query) => __awaiter(void 0, void 0, void 0, function* () {
    if (user.role !== user_1.USER_ROLES.ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admin can access it");
    }
    const baseQuery = notification_model_1.Notification.find().sort({ createdAt: -1 });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, query);
    const allNotification = queryBuilder
        .search(constrant_1.excludeField)
        .filter()
        .sort();
    const [meta, data] = yield Promise.all([
        allNotification.getMeta(),
        allNotification.build(),
    ]);
    return { meta, data };
});
exports.ActionService = { statusChange, DashBoard, blockUser, AllTicketBuyerUser, ticketActivity, accountDeleteHistory, allNotification };
