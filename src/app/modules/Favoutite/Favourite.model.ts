import mongoose, { Schema, Types } from "mongoose";


export interface IFavourite {
    favouriterUserId:Types.ObjectId;
    categoryId:Types.ObjectId;
    subCategoryId:Types.ObjectId[];
}


const FavouriteSchema = new mongoose.Schema<IFavourite>({
    favouriterUserId:{type:Schema.Types.ObjectId,ref:'User'},
    categoryId:{type:Schema.Types.ObjectId,ref:'Category'},
    subCategoryId:[{
        type:Schema.Types.ObjectId,
        ref:'SubCategory'
    }]
},{versionKey:false})

export const Favourite = mongoose.model<IFavourite>('Favourite',FavouriteSchema)