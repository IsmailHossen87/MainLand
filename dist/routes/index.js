"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = require("../app/modules/auth/auth.route");
const user_route_1 = require("../app/modules/user/user.route");
const Payment_route_1 = require("../app/modules/Payment/Payment.route");
const Event_Route_1 = require("../app/modules/ORGANIZER/Event/Event.Route");
const Action_Router_1 = require("../app/modules/ADMIN/Action/Action.Router");
const SettingRoute_1 = require("../app/modules/Setting/SettingRoute");
const ticket_route_1 = require("../app/modules/Ticket/ticket.route");
const Favourite_route_1 = require("../app/modules/Favoutite/Favourite.route");
const notification_route_1 = require("../app/modules/Notification/notification.route");
const message_route_1 = require("../app/modules/Message/message-route");
const chat_router_1 = require("../app/modules/Chat/chat.router");
const stripeAccount_route_1 = __importDefault(require("../app/modules/stripeAccount/stripeAccount.route"));
const Payout_route_1 = require("../app/modules/Payout/Payout.route");
const router = express_1.default.Router();
const apiRoutes = [
    {
        path: '/user',
        route: user_route_1.UserRoutes,
    },
    {
        path: '/auth',
        route: auth_route_1.AuthRoutes,
    },
    {
        path: '/notification',
        route: notification_route_1.NotificationRoutes,
    },
    {
        path: '/event',
        route: Event_Route_1.EventRoutes,
    },
    {
        path: '/payment',
        route: Payment_route_1.PaymentRouter,
    },
    {
        path: '/payout',
        route: Payout_route_1.payoutRoutes,
    },
    {
        path: '/action',
        route: Action_Router_1.ActionRouter,
    },
    {
        path: '/ticket',
        route: ticket_route_1.TicketRouter,
    },
    {
        path: '/settings',
        route: SettingRoute_1.SettingRouter,
    },
    {
        path: '/favourite',
        route: Favourite_route_1.FavouriteRouter,
    },
    {
        path: '/chat',
        route: chat_router_1.ChatRoutes,
    },
    {
        path: '/message',
        route: message_route_1.MessageRouter,
    },
    {
        path: '/stripe-account',
        route: stripeAccount_route_1.default,
    }
];
apiRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
