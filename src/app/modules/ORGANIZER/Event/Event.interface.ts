import { Types } from "mongoose"

export interface ICategory{ 
    userId:Types.ObjectId,
    title:string,
    coverImage:string
}


export interface IEvent{
    userId:Types.ObjectId,
    eventName :string,
    title :string,
    image :string,
    category? :Types.ObjectId[],
    location :string,
    totalEarned :number,
    startTime :Date,
    endTime :Date,
    address :string,
    totalReview :Types.ObjectId[],
    statusEnded :'Ongoing' | 'Ended' |'Cancelled',
    description :string,
    isDraft:boolean
}