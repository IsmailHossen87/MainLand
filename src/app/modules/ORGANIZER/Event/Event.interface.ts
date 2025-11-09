import { Types } from "mongoose"

export interface ICategory{ 
    userId:Types.ObjectId,
    title:string,
    coverImage:string
}

export enum TicketType {
  PREMIUM = "Premium",
  VIP = "VIP",
  STANDARD = "Standard",
}

export interface IEvent {
  userId: Types.ObjectId;
  eventName: string;
  title: string;
  image: string;
  category?: Types.ObjectId[]; 
  tags?: string[]; 
  description: string;

  eventDate: Date;
  startTime: string; 
  endTime: string;  

  // Location
  address: string;
  streetAddress?: string;
  streetAddress2?: string;
  city: string;
  state: string;
  country: string;

  // Tickets details
  tickets?: {
    type: TicketType
    price: number;
    availableUnits: number;
  }[];

  // Sale details
  ticketSaleStart?: Date;
  ticketSaleEnd?: Date;
  preSaleStart?: Date;
  preSaleEnd?: Date;

  // Discount
  discountCodes?: {
    code: string;
    percentage: number; // e.g. 10 means 10%
  }[];

  // Organizer info
  organizerName?: string;
  organizerType?: string; // e.g. 'Event Organizer' or 'Company'
  organizerEmail?: string;
  organizerPhone?: string;

  // Other
  locationName?: string;
  totalEarned: number;
  totalReview: Types.ObjectId[];
  status: "Pending" | "Accepted" | "Rejected";
  isDraft: boolean;
}
