import { IMessage } from "../app/modules/Message/message-interface";
import { INotification } from "../app/modules/Notification/notification.interface";
import { Notification } from "../app/modules/Notification/notification.model";

export type IChanelType = "message" | "notification";

export const sendNotifications = async (
    data: any,
    chanelType: IChanelType
): Promise<INotification> => {

    let notification;
    if (data.eventId) {
        notification = await Notification.findOneAndUpdate(
            { eventId: data.eventId },
            { $set: data },
            {
                new: true,
                upsert: true,
            }
        );
    }
<<<<<<< HEAD
    else if (data.chatId) {
        notification = await Notification.findOneAndUpdate(
            { chatId: data.chatId },
            { $set: data },
            {
                new: true,
                upsert: true,
            }
        );
    }
=======
>>>>>>> 9f6a712c2ce34eaabda8dbd316a9c751c25ad6d8
    else {
        notification = await Notification.create(data);
    }


    console.log(data, chanelType)
    // @ts-ignore
    const socketIo = global.io;

    if (socketIo) {
        const channel = chanelType === "notification" ? `notification::${data.receiver}` : `message::${data.receiver}`;

        socketIo.emit(channel, data);
    }

    return notification;
};


