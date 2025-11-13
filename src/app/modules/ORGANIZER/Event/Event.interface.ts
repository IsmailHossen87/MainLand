import { Types } from "mongoose";

export interface ICategory { 
  userId: Types.ObjectId;
  title: string;
  coverImage: string;
  subCategoryId?: Types.ObjectId[];
}

export interface ISubcategory {
  userId: Types.ObjectId;
  title: string;
}

export enum TicketType {
  PREMIUM = "Premium",
  VIP = "VIP",
  STANDARD = "Standard",
  FREE = "Free",
}

export interface IEvent {
  userId: Types.ObjectId;
  eventName: string;
  title: string;
  image?: string;
  category?: Types.ObjectId[];
  tags?: string[];
  description?: string;

  eventDate?: Date;
  startTime?: string;
  endTime?: string;

  // Location
  address?: string;
  streetAddress?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  country?: string;

  // Tickets
  tickets?: {
    type: TicketType;
    price: number;
    availableUnits: number;
    ticketBuyerId?: Types.ObjectId[];
  }[];

  // Sale
  ticketSaleStart?: Date;
  ticketSaleEnd?: Date;
  preSaleStart?: Date;
  preSaleEnd?: Date;

  // Discount
  discountCodes?: {
    code: string;
    percentage: number;
  }[];

  // Organizer
  organizerName?: string;
  organizerType?: string;
  organizerEmail?: string;
  organizerPhone?: string;

  // Other
  locationName?: string;
  totalEarned: number;
  totalReview?: Types.ObjectId[];
  status: "Pending" | "Accepted" | "Rejected";
  isDraft: boolean;
}
