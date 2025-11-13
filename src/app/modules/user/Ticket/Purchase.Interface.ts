import { Types } from "mongoose"

export interface IAttendInformation{
    fullName:string,
    email:string,
    phone:string
}

export interface ITicketRequest {
  ticketType: string;
  quantity: number;
}

export interface TicketPruchase {
    eventId:Types.ObjectId,
    userId:Types.ObjectId,
    attenInformation:IAttendInformation,
    tickets:{ticketType:ITicketRequest}[];
    mailLandFee:number;
    totalAmount:number,
    discount:number,

}



