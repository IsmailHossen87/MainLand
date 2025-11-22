import { Types } from "mongoose"
import { EventTicket } from "../../ORGANIZER/Event/Event.Service";

export interface IAttendInformation{
    fullName:string,
    email:string,
    phone:string
}
export type IStatus = "available" | "sold" | "cancelled";

export interface ITicketRequest {
  ticketType: string | EventTicket;
  quantity: number;
}

// export interface TicketPruchase {
//     eventId:Types.ObjectId,
//     userId:Types.ObjectId,
//     attenInformation:IAttendInformation,
//     tickets:{ticketType:ITicketRequest}[];
//     mailLandFee:number;
//     totalAmount:number,
//     discount:number,
//     status:IStatus
// }

export interface ITicketPurchase {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  attenInformation: IAttendInformation;
  tickets: {
    ticketType: ITicketRequest;
    quantity:number;
  }[];
  mailLandFee: number;
  totalAmount: number;
  discount: number;
  status:IStatus
}

export interface IResellTicket {
  originalTicketId: Types.ObjectId; 
  sellerId: Types.ObjectId; 
  eventId: Types.ObjectId;
  ticketType: string; 
  quantity: number;
  originalPrice: number;
  resellPrice: number;
  status: 'available'  | 'NotAvailable';
  soldTo?: Types.ObjectId; 
  soldAt?: Date;
  secondaryBuyer:Types.ObjectId[];
}


export interface ISecondaryTicketPurchase {
  resellTicketId: Types.ObjectId; 
  resellersUserId: Types.ObjectId; 
  buyerId: Types.ObjectId; 
  eventId: Types.ObjectId;
  quantity: number;
  personalInfo:{
    fullName:string,
    email:string,
    phoneNumber:string
  };
  resellPrice: number;
}

