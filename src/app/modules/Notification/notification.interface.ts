import { Types } from 'mongoose';

export interface INotification {
    message: string;
    senderId: Types.ObjectId;
    receiver: Types.ObjectId;
    eventTitle: string,
    eventId: Types.ObjectId,
    read: boolean;
    type?: 'EVENT' | 'NOTIFICATION' | 'SELL_TICKET' | 'MESSAGE' | 'WITHDRAW_TICKET';
    title?: string;
    isDraft?: boolean;
    eventStatus?: string;
    status?: 'success' | 'rejected';
}
