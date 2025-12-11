"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketRouter = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const ticket_controller_1 = require("./ticket.controller");
const paymentController_1 = require("../Payment/paymentController");
const router = (0, express_1.Router)();
router.get('/getAllTicket', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.getAllTicket);
router.get('/unique-event', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.getUniqueEvents);
router.get('/sold-event', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.getSoldEvent); //..............
router.get('/sellAllTicket', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.allOnsellTicketInfo);
router.post('/ticketPurchase/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), paymentController_1.PaymentController.buyTicket);
router.get("/soldTickethistory", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.soldTicket);
// 🔥🔥
router.get("/event-summary", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.eventSummary);
router.get('/expired-ticket', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.ticketExpired); //..............
// ------------------------------------------------------
router.post('/withdraw-pro/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.withdrawPro);
router.get('/sellHistory/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.sellTicketInfoUsers);
router.get('/available-type-history/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.avaiableTypeHistory);
router.get('/sell-history-onsell/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.sellTicketInfoUsersOnsell); //single AllType Ticket
router.get('/resellTicket/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.resellTicket);
// --------------------------------------------------------
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.getOneTicket);
router.get("/check-event/:eventCode", (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), ticket_controller_1.TicketController.checkEvent);
router.get('/promocode/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.PromoCodePercentage);
router.get("/sold-view-history/:id", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.soldTicketHistory);
router.get("/history-tickets/:id", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), ticket_controller_1.TicketController.historyTickets); //adminDashboard
exports.TicketRouter = router;
