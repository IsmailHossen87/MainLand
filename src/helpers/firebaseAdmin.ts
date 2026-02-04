
import { Notification } from "../app/modules/Notification/notification.model";
import { firebaseAdmin } from "./firebase";


<<<<<<< HEAD

export const firebaseNotificationBuilder = ({ user, title, body, image = "", chatId = '', eventId = '', type = '', avatar = '' }: {
    user: any;
    title: string;
    body: string;
    image?: string;
    chatId?: string;
    eventId?: string;
    type?: string;
    avatar?: string;
}) => {

    const sound = user.isSoundNotificationEnabled ? "default" : undefined;
    const notification = sendFirebaseNotification(
        user.fcmToken,
=======
export const firebaseNotificationBuilder = ({ user, title, message, data, }: {
    user: any;
    title: string;
    message: string;
    data: Record<string, string>;
}) => {
    console.log("check data", data)
    const sound = user.isSoundNotificationEnabled ? "default" : undefined;
    const notification = sendFirebaseNotification(
        user.fcmToken,
        title,
        message,
>>>>>>> 9f6a712c2ce34eaabda8dbd316a9c751c25ad6d8
        sound,
        {
            isSoundNotificationEnabled: `${user.isSoundNotificationEnabled}`,
            isVibrationNotificationEnabled: `${user.isVibrationNotificationEnabled}`,
<<<<<<< HEAD
            title,
            body,
            image,
            chatId,
            eventId,
            type,
            avatar
=======

            ...data,
>>>>>>> 9f6a712c2ce34eaabda8dbd316a9c751c25ad6d8
        }
    );

    return notification;
};


export const sendFirebaseNotification = async (
    token: string,
<<<<<<< HEAD
=======
    title: string,
    body: string,
>>>>>>> 9f6a712c2ce34eaabda8dbd316a9c751c25ad6d8
    sound: string | undefined,
    data?: Record<string, string>
) => {
    if (!token) return;

    const notification: any = {
        token,
<<<<<<< HEAD
=======

>>>>>>> 9f6a712c2ce34eaabda8dbd316a9c751c25ad6d8
        data: data ?? {},
        android: {
            priority: "high",
        },
        apns: {
            headers: {
                "apns-push-type": "alert",
                "apns-priority": "10",
            },
            payload: {

                aps: {
                    alert: {
<<<<<<< HEAD
                        title: data?.title,
                        body: data?.body,
=======
                        title,
                        body,
>>>>>>> 9f6a712c2ce34eaabda8dbd316a9c751c25ad6d8
                    },
                    // sound: "default",
                    ...(sound && { sound }),

                },
            },
        },
    };


    await firebaseAdmin.messaging().send(notification);

};


export const saveNotification = async (data: any) => {
    const notification = await Notification.findOneAndUpdate(
        { eventId: data.eventId },
        { $set: data },
        {
            new: true,
            upsert: true,
        }
    );

    return notification;
};
