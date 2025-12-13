import { model, Model, Schema, Types } from 'mongoose';

export interface IChat {
    _id?: Types.ObjectId;
    participants: Types.ObjectId[];
    lastText: string;
    lastImage: string[];
    status: boolean;
    isReported: boolean;
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
        lastText: {
            type: String,
            default: '',
        },
        lastImage: [{
            type: String,
            default: '',
        }],
        isReported: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);
export const Chat = model<IChat, ChatModel>('Chat', chatSchema);



// REPORT
export interface IReport {
    reporterUserId: Types.ObjectId;
    reportedUserId: Types.ObjectId;
    chatId: Types.ObjectId;
    Privacy_concerns: boolean;
    Others: string;
    Obscene: boolean;
    Defamation: boolean;
    Copyright_violations: boolean;
    Erotic_content: boolean;
    createdAt?: Date;
    updatedAt?: Date;

}
export type ReportModel = Model<IReport, Record<string, unknown>>;

const reportSchema = new Schema<IReport, ReportModel>(
    {
        reporterUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        reportedUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        chatId: {
            type: Schema.Types.ObjectId,
            ref: 'Chat',
        },
        Privacy_concerns: {
            type: Boolean,
            default: false,
        },
        Others: {
            type: String,
            default: '',
        },
        Obscene: {
            type: Boolean,
            default: false,
        },
        Defamation: {
            type: Boolean,
            default: false,
        },
        Copyright_violations: {
            type: Boolean,
            default: false,
        },
        Erotic_content: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);
export const Report = model<IReport, ReportModel>('Report', reportSchema);


