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


export interface IResellTicket {
  originalTicketId: Types.ObjectId; 
  sellerId: Types.ObjectId; 
  eventId: Types.ObjectId;
  ticketType: string; 
  quantity: number;
  originalPrice: number;
  resellPrice: number;
  status: 'available' | 'sold' | 'cancelled';
  soldTo?: Types.ObjectId; 
  soldAt?: Date;
}


export interface ISecondaryTicketPurchase {
  originalTicketId: Types.ObjectId; 
  sellerId: Types.ObjectId; 
  eventId: Types.ObjectId;
  ticketType: string; 
  quantity: number;
  personalInfo:{
    fullName:string,
    email:string,
    phoneNumber:string
  };
  resellPrice: number;
  status: 'available' | 'sold' | 'cancelled';
}

