import mongoose, { Types } from "mongoose";
import { Favourite, IFavourite } from "./Favourite.model";
import ApiError from "../../../errors/ApiError";
import { Event } from "../ORGANIZER/Event/Event.model";
import { StatusCodes } from "http-status-codes";

const createFavourite = async (userId: string, payload: IFavourite[]) => {
    if (payload.length === 0) {
        throw new Error("Payload is empty!!");
    }
    payload.forEach((item) => {
        item.favouriterUserId = new mongoose.Types.ObjectId(userId);
    });

    await Favourite.deleteMany({ favouriterUserId: userId });
    const result = await Favourite.insertMany(payload);
    return result;
};
const getUserFavouriteEvents = async (userId: string) => {
    const favourites = await Favourite.find({ favouriterUserId: userId });

    if (!favourites) {
        throw new ApiError(StatusCodes.NOT_FOUND, "No favourite events found");
    }

    const matchConditions: { categoryId: Types.ObjectId; subCategoryId: Types.ObjectId }[] = [];

    favourites.forEach(fav => {
        fav.subCategoryId.forEach(subId => {
            matchConditions.push({
                categoryId: fav.categoryId,
                subCategoryId: subId
            });
        });
    });

    const events = await Event.aggregate([
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
};


export const FavouriteService = {
    createFavourite,
    getUserFavouriteEvents,
};
