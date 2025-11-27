import mongoose from "mongoose";
import { Favourite, IFavourite } from "./Favourite.model";
import ApiError from "../../../errors/ApiError";

const createFavourite = async (userId: string, payload: IFavourite[]) => {
    if(payload.length === 0){
        throw new Error("Payload is empty!!");
    } 
    payload.forEach((item) => {
        item.favouriterUserId = new mongoose.Types.ObjectId(userId);
    });

    await Favourite.deleteMany({ favouriterUserId: userId });
    const result = await Favourite.insertMany(payload);
    return result;
};

export const FavouriteService = {
    createFavourite,
};
