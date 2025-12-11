"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripeAccount_controller_1 = require("./stripeAccount.controller");
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
// import { auth } from "../../middlewares/auth.js";
const stripeAccountRoutes = (0, express_1.Router)();
stripeAccountRoutes.post('/connected-user/login-link', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), stripeAccount_controller_1.stripeAccountController.stripeLoginLink);
stripeAccountRoutes
    .post('/create-connected-account', (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), stripeAccount_controller_1.stripeAccountController.createStripeAccount)
    .get('/success-account/:id', stripeAccount_controller_1.stripeAccountController.successPageAccount)
    .get('/refreshAccountConnect/:id', stripeAccount_controller_1.stripeAccountController.refreshAccountConnect);
stripeAccountRoutes.get('/success-account/:accountId', stripeAccount_controller_1.stripeAccountController.onConnectedStripeAccountSuccess);
exports.default = stripeAccountRoutes;
