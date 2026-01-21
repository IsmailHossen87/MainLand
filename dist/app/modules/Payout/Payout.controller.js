"use strict";
// controllers/payout.controller.ts
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
exports.payoutController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const Payout_service_1 = require("./Payout.service");
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../user/user.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const transactionHistory_1 = require("../Payment/transactionHistory");
/**
 * ✅ Admin: Manually trigger payout for an event
 */
const triggerEventPayout = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    yield Payout_service_1.payoutService.processEventPayoutManually(eventId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Payout processed successfully',
    });
}));
/**
 * ✅ Payout money
 */
const withdrawBalance = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // From auth middleware
    const result = yield Payout_service_1.payoutService.withdrawBalance(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Withdrawal successful! Money transferred to your Stripe account.',
        data: result
    });
}));
/**
 * ✅ Admin: Get payout summary for an event
 */
const getEventPayoutSummary = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const summary = yield Payout_service_1.payoutService.getEventPayoutSummary(eventId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Payout summary retrieved successfully',
        data: summary,
    });
}));
/**
 * ✅ User: Get my balance (pending + available)
 */
const getMyBalance = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const user = yield user_model_1.User.findById(userId).select('pendingBalance availableBalance totalEarnings');
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Balance retrieved successfully',
        data: {
            pendingBalance: ((_b = user === null || user === void 0 ? void 0 : user.stripeAccountInfo) === null || _b === void 0 ? void 0 : _b.pendingBalance) || 0,
            availableBalance: ((_c = user === null || user === void 0 ? void 0 : user.stripeAccountInfo) === null || _c === void 0 ? void 0 : _c.availableBalance) || 0,
            totalEarnings: (user === null || user === void 0 ? void 0 : user.totalEarnings) || 0,
        },
    });
}));
/**
 * ✅ User: Get my payout history
 */
const getMyPayoutHistory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const transactions = yield transactionHistory_1.TransactionHistory.find({
        organizerId: userId,
        organizerPayout: { $gt: 0 }
    })
        .populate('eventId', 'eventName eventDate')
        .sort({ createdAt: -1 });
    const history = transactions.map(txn => {
        var _a, _b;
        return ({
            transactionId: txn._id,
            eventName: (_a = txn.eventId) === null || _a === void 0 ? void 0 : _a.eventName,
            eventDate: (_b = txn.eventId) === null || _b === void 0 ? void 0 : _b.eventDate,
            amount: txn.organizerPayout,
            status: txn.payoutStatus,
            payoutDate: txn.payoutDate,
            stripeTransferId: txn.stripeTransferId,
            createdAt: txn.createdAt
        });
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Payout history retrieved successfully',
        data: history,
    });
}));
/**
 * ✅ User: Get pending payouts (যে টাকা আসবে)
 */
const getMyPendingPayouts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const pendingTransactions = yield transactionHistory_1.TransactionHistory.find({
        organizerId: userId,
        payoutStatus: 'pending',
        organizerPayout: { $gt: 0 }
    })
        .populate('eventId', 'eventName eventDate payoutEligibleDate')
        .sort({ payoutEligibleDate: 1 });
    const pending = pendingTransactions.map(txn => {
        var _a, _b, _c;
        return ({
            transactionId: txn._id,
            eventName: (_a = txn.eventId) === null || _a === void 0 ? void 0 : _a.eventName,
            eventDate: (_b = txn.eventId) === null || _b === void 0 ? void 0 : _b.eventDate,
            amount: txn.organizerPayout,
            payoutEligibleDate: txn.payoutEligibleDate || ((_c = txn.eventId) === null || _c === void 0 ? void 0 : _c.payoutEligibleDate),
            daysRemaining: txn.payoutEligibleDate
                ? Math.ceil((new Date(txn.payoutEligibleDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null
        });
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Pending payouts retrieved successfully',
        data: pending,
    });
}));
exports.payoutController = {
    triggerEventPayout,
    getEventPayoutSummary,
    getMyBalance,
    getMyPayoutHistory,
    getMyPendingPayouts,
    withdrawBalance
};
