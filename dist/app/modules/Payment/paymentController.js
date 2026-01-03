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
exports.PaymentController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const PaymentService_1 = require("./PaymentService");
// ================= Primary Event Ticket Purchase =================
const createEventPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const eventId = req.params.id;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { fullName, email, phone, tickets, discountCode } = req.body;
    console.log(userId);
    const paymentSession = yield PaymentService_1.createPaymentService.createPaymentIntentEvent(eventId, { fullName, email, phone, tickets, discountCode, userId });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Redirect to Stripe Checkout',
        data: paymentSession,
    });
}));
// ================= Resell Ticket Payment =================
const buyTicket = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = req.params.id;
    const { fullName, email, phone, tickets } = req.body;
    const paymentSession = yield PaymentService_1.createPaymentService.BuyTicket({ fullName, email, phone, tickets, userId, eventId });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Redirect to payment',
        data: paymentSession,
    });
}));
exports.PaymentController = {
    createEventPayment,
    buyTicket,
};
