import { Types } from "mongoose";

export interface INotification {
  userId:Types.ObjectId;
  title: string;
  isDraft:boolean;
  DeliveryMethod: 'email' | 'notification';
  recipientType: 'Active' | 'Closed' | 'Winner Announced';
  message:string
}
