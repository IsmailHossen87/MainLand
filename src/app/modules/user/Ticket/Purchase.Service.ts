import { StatusCodes } from "http-status-codes"
import ApiError from "../../../../errors/ApiError"
import { User } from "../user.model"
import { ITicketPurchase } from "./Purchase.Mode"
import { Event } from "../../ORGANIZER/Event/Event.model"

const BuyTicket = async(userId : string,payload:ITicketPurchase,eventId:string )=>{
    const user = await User.findById(userId)
    const event = await Event.findById(eventId)
    if(!user){
        throw new ApiError(StatusCodes.NOT_FOUND,"User is not available")
    }
    if(!event){
        throw new ApiError(StatusCodes.NOT_FOUND,"Event is not available")
    } 
    
    
}

export const TicketPurchaseService ={BuyTicket}