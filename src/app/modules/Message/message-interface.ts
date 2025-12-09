import { Model, Types } from 'mongoose';

export interface IReaction {
    userId: Types.ObjectId;
    createdAt?: Date;
}

export interface IMessage {
    _id?: Types.ObjectId;
    chatId: Types.ObjectId;
    replyTo?: Types.ObjectId | null;
    replies?: Types.ObjectId[];
    read: boolean;
    sender: Types.ObjectId;
    text?: string;
    image?: string;
    isDeleted?: boolean;
    deletedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export type MessageModel = Model<IMessage, Record<string, unknown>>;