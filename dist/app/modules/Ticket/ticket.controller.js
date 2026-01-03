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
exports.TicketController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const ticket_service_1 = require("./ticket.service");
// ================= Primary Event Ticket Purchase =================
const getAllTicket = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    //   const eventId = req.params.id;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const query = req.query;
    const result = yield ticket_service_1.TicketService.getAllTicket(userId, query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Get All Ticket',
        data: result === null || result === void 0 ? void 0 : result.data,
        meta: result === null || result === void 0 ? void 0 : result.meta,
    });
}));
// GetOneTicket
const getOneTicket = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const ticketId = req.params.id;
    const result = yield ticket_service_1.TicketService.getOneTicket(userId, ticketId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Get All Ticket',
        data: result,
    });
}));
// UNIQUE EVENT
const getUniqueEvents = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const query = req.query;
    const result = yield ticket_service_1.TicketService.getUniqueEvents(userId, query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Unique Events retrived Successfully',
        data: result,
    });
}));
// UNIQUE SOLD
// UNIQUE EVENT
const getSoldEvent = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield ticket_service_1.TicketService.getSoldEvent(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Unique Sold Event retrived Successfully',
        data: result,
    });
}));
const sellTicketInfoUsers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = req.params.id;
    const query = req.query;
    const result = yield ticket_service_1.TicketService.sellTicketInfoUsers(userId, eventId, query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket  retrived Successfully',
        data: result,
    });
}));
const sellTicketInfoUsersOnsell = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = req.params.id;
    const query = req.query;
    const result = yield ticket_service_1.TicketService.sellTicketInfoUsersOnsell(userId, eventId, query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket  retrived Successfully',
        data: { tickets: result },
    });
}));
// All
const allOnsellTicketInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const query = req.query;
    const result = yield ticket_service_1.TicketService.allOnsellTicketInfo(userId, query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'All Ticket Type retrived Successfully',
        data: result,
    });
}));
const resellTicket = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = req.params.id;
    const tickets = req.body; // Array of objects asbe
    const result = yield ticket_service_1.TicketService.resellTicket(userId, eventId, tickets);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket retrived Successfully',
        data: result,
    });
}));
// WITHDRAWpromocode
const withdrawPro = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = req.params.id;
    const result = yield ticket_service_1.TicketService.withdrawPro(userId, eventId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket  retrived Successfully',
        data: result,
    });
}));
const soldTicket = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield ticket_service_1.TicketService.soldTicket(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Sold Ticket  retrived Successfully',
        data: result
    });
}));
const ticketExpired = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield ticket_service_1.TicketService.ticketExpired(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event Expired retrived Successfully',
        data: result
    });
}));
const eventSummary = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { sellerType, ticketType, eventId } = req.query;
    const result = yield ticket_service_1.TicketService.eventSummary({ userId, sellerType, ticketType, eventId });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event Expired retrived Successfully',
        data: result
    });
}));
const PromoCodePercentage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { id } = req.params;
    const { code } = req.body;
    const result = yield ticket_service_1.TicketService.promocode(userId, id, code);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Promo Code retrived Successfully',
        data: result
    });
}));
const avaiableTypeHistory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { id } = req.params;
    const result = yield ticket_service_1.TicketService.availableTypeHistory(userId, id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Available Type retrived Successfully',
        data: result
    });
}));
// Bar code generate
const checkEvent = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { eventCode } = req.params;
    const result = yield ticket_service_1.TicketService.checkEvent(userId, eventCode);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event retrived Successfully',
        data: result,
    });
}));
// Bar code generate
const soldTicketHistory = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { id } = req.params;
    const { expired } = req.query;
    const result = yield ticket_service_1.TicketService.soldTicketHistory(userId, id, expired);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event retrived Successfully',
        // data: result.flatMap((item) => item.ticketInfo),
        data: result
    });
}));
const historyTickets = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { id } = req.params;
    console.log("id", id);
    const result = yield ticket_service_1.TicketService.historyTickets(userId, id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Event retrived Successfully',
        // data: result.flatMap((item) => item.ticketInfo),
        data: result
    });
}));
exports.TicketController = {
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
    PromoCodePercentage,
    withdrawPro,
    sellTicketInfoUsersOnsell,
    avaiableTypeHistory,
    checkEvent,
    soldTicketHistory,
    historyTickets,
};
