import { model, Model, Schema, Types } from 'mongoose';

export interface IChat {
    _id?: Types.ObjectId;
    participants: Types.ObjectId[]; // FIXED: Should be array of ObjectId
    status: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ChatModel = Model<IChat, Record<string, unknown>>;

const chatSchema = new Schema<IChat, ChatModel>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        status: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // ADDED: For createdAt and updatedAt
    }
);

// ADDED: Index for faster queries
// chatSchema.index({ participants: 1 });

export const Chat = model<IChat, ChatModel>('Chat', chatSchema);