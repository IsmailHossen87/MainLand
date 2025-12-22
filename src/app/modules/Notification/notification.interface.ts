import { Types } from 'mongoose';

export interface INotification {
    message: string;
    userId:Types.ObjectId;
    receiver: Types.ObjectId;
    eventTitle: string,
    eventId: Types.ObjectId,
    read: boolean;
    type?: 'EVENT' | 'NOTIFICATION' | 'SELL_TICKET';
    title?: string;
    isDraft?: boolean;
    status?: 'success' | 'rejected';
}
