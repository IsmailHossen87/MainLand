import { Types } from "mongoose";
export interface CreateEventPayload {
  userId: string;
  eventName: string;
  isDraft?: boolean;
  category?: Array<{
    categoryId: Types.ObjectId;
    subCategory: Types.ObjectId[];
  }>;
  [key: string]: any;
}
export interface UpdateEventPayload {
  category?: Array<{
    categoryId: string | Types.ObjectId;
    subCategory: (string | Types.ObjectId)[];
  }>;
  [key: string]: any; // allow other fields dynamically
}

export interface ICategory {
  userId: Types.ObjectId;
  title: string;
  coverImage: string;
}

export interface ISubcategory {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  title: string;
}
export interface ICategoryItem {
  categoryId: Types.ObjectId;
  subCategory: Types.ObjectId[];
}
export enum TicketType {
  PREMIUM = "Premium",
  VIP = "VIP",
  STANDARD = "Standard",
  OTHER = "Other",
}
export enum IEventStatus {
  Live = "Live",
  UnderReview = "UnderReview",
  Closed = "Closed",
  Sold = "Sold",
  Expired = "Expired",
  Upcoming = "Upcoming",
  Used = "Used",
  Available = "Available",
  Draft = "Draft",
}

export interface IEvent {
  userId: Types.ObjectId;
  eventName: string;
  image?: string;
  category?: ICategoryItem[];
  tags?: string[];
  description?: string;

  eventDate?: Date;
  startTime?: string;
  endTime?: string;


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
  preSaleStart?: Date;
  preSaleEnd?: Date;
  EventStatus?: IEventStatus;
  // Discount
  discountCodes?: {
    code: string;
    percentage: number;
    expireDate: Date
  }[];
  isFreeEvent?: boolean;

  // Organizer
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;

  // Other
  locationName?: string;
  totalEarned: number;
  totalReview?: Types.ObjectId[];
  isDraft: boolean;
}
