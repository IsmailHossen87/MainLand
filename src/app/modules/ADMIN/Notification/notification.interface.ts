import { Types } from "mongoose";

export interface INotification {
  userId:Types.ObjectId;
  type: string;
  title: string;
  recipientGroup: string;
  dateSent: Date;
  status: 'Sent' | 'Draft';
  recipientType: 'Active' | 'Closed' | 'Winner Announced';
}
