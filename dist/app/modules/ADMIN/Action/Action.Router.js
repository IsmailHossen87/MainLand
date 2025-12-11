"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionRouter = void 0;
const express_1 = require("express");
const user_1 = require("../../../../enums/user");
const ActionController_1 = require("./ActionController");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const router = (0, express_1.Router)();
router.get("/dashboard", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), ActionController_1.ActionController.DashBoard);
router.get("/account-delete-history", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), ActionController_1.ActionController.accountDeleteHistory);
router.get("/all-notification", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), ActionController_1.ActionController.allNotification);
router.get("/all-user", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), ActionController_1.ActionController.AllTicketBuyerUser);
router.patch('/block-user/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), ActionController_1.ActionController.blockUser);
router.get("/ticket-activity/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), ActionController_1.ActionController.ticketActivity);
// .get("/allResellTicket",auth(USER_ROLES.ADMIN),ActionController.allResellTicket)
router.patch('/event/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), ActionController_1.ActionController.statusChange);
exports.ActionRouter = router;
