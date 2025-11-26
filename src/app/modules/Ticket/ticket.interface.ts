import { Types } from "mongoose"
import { EventTicket } from "../ORGANIZER/Event/Event.Service";

export type IResellTicket = { ticketType: string; quantity: number; resellAmount: number; }

export interface IAttendeeInformation {
    fullName: string,
    email: string,
    phone: string
}
export enum ITicketStatus { available = "available", sold = "sold", onsell = "onsell", live = "live", upcoming = "upcoming", used = "used", cancelled = "cancelled" };

// export type TicketStatus = "available" | "sold"| "onsell" | "live" | "upcoming" | "used" | "cancelled";
// export type IUserRole ="owner" | "buyer";


export interface ITicketRequest {
    ticketType: string | EventTicket;
    quantity: number;
}

export interface ITicketPurchase {
    eventId: Types.ObjectId;
    ownerId: Types.ObjectId;
    sellerId: Types.ObjectId;
    attendeeInformation: IAttendeeInformation;
    ticketType: string | EventTicket;
    ticketName: string;
    mainLandFee: number;
    purchaseAmount: number;
    sellAmount: number;
    discount: number;
    status: ITicketStatus,
    discountCode: string;
    // userRole: IUserRole
}



