import { Types } from 'mongoose';

export interface INotification {
    message: string;
    receiver: Types.ObjectId;
    eventTitle: string,
    eventId: Types.ObjectId,
    read: boolean;
    type?: 'EVENT' | 'NOTIFICATION';
    title?: string;
    isDraft?: boolean;
    status?: 'success' | 'rejected';
}
