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
exports.FavouriteService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Favourite_model_1 = require("./Favourite.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const Event_model_1 = require("../ORGANIZER/Event/Event.model");
const http_status_codes_1 = require("http-status-codes");
const createFavourite = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (payload.length === 0) {
        throw new Error("Payload is empty!!");
    }
    payload.forEach((item) => {
        item.favouriterUserId = new mongoose_1.default.Types.ObjectId(userId);
    });
    yield Favourite_model_1.Favourite.deleteMany({ favouriterUserId: userId });
    const result = yield Favourite_model_1.Favourite.insertMany(payload);
    return result;
});
const getUserFavouriteEvents = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const favourites = yield Favourite_model_1.Favourite.find({ favouriterUserId: userId });
    if (!favourites) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No favourite events found");
    }
    const matchConditions = [];
    favourites.forEach(fav => {
        fav.subCategoryId.forEach(subId => {
            matchConditions.push({
                categoryId: fav.categoryId,
                subCategoryId: subId
            });
        });
    });
    const events = yield Event_model_1.Event.aggregate([
        { $unwind: "$category" },
        { $unwind: "$category.subCategory" },
        {
            $match: {
                $or: matchConditions.map(cond => ({
                    "category.categoryId": cond.categoryId,
                    "category.subCategory": cond.subCategoryId
                }))
            }
        },
        {
            $project: {
                _id: 1,
                eventName: 1,
                eventDate: 1,
                image: 1,
                isFreeEvent: 1,
                streetAddress: 1,
                streetAddress2: 1,
                ticketSaleStart: 1,
                preSaleStart: 1
            }
        },
        {
            $group: {
                _id: "$_id", // group by unique event _id
                eventName: { $first: "$eventName" },
                eventDate: { $first: "$eventDate" },
                image: { $first: "$image" },
                isFreeEvent: { $first: "$isFreeEvent" },
                streetAddress: { $first: "$streetAddress" },
                streetAddress2: { $first: "$streetAddress2" },
                ticketSaleStart: { $first: "$ticketSaleStart" },
                preSaleStart: { $first: "$preSaleStart" }
            }
        }
    ]);
    return events;
});
exports.FavouriteService = {
    createFavourite,
    getUserFavouriteEvents,
};
