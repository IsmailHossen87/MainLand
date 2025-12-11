"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavouriteRouter = void 0;
const express_1 = require("express");
const Favourite_controller_1 = require("./Favourite.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const router = (0, express_1.Router)();
router.post("/", (req, res, next) => {
    console.log("check hit the categhory", req.body);
    next();
}, (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), Favourite_controller_1.FavouriteController.FavouriteCreate);
router.get("/", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), Favourite_controller_1.FavouriteController.FavouriteEvent);
exports.FavouriteRouter = router;
