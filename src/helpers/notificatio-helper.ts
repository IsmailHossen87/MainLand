import { IMessage } from "../app/modules/Message/message-interface";
import { INotification } from "../app/modules/Notification/notification.interface";
import { Notification } from "../app/modules/Notification/notification.model";

export type IChanelType = "message" | "notification";

export const sendNotifications = async (
    data: Partial<INotification>,
    chanelType: IChanelType
): Promise<INotification> => {

    const result = await Notification.create(data);

    // @ts-ignore
    const socketIo = global.io;

    if (socketIo) {
        const channel = chanelType === "notification" ? `notification::${data.receiver}` : `message::${data.receiver}`;

        socketIo.emit(channel, result);
    }

    return result;
};


