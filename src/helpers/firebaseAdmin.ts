
import { Notification } from "../app/modules/Notification/notification.model";
import { firebaseAdmin } from "./firebase";


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
        sound,
        {
            isSoundNotificationEnabled: `${user.isSoundNotificationEnabled}`,
            isVibrationNotificationEnabled: `${user.isVibrationNotificationEnabled}`,

            ...data,
        }
    );

    return notification;
};


export const sendFirebaseNotification = async (
    token: string,
    title: string,
    body: string,
    sound: string | undefined,
    data?: Record<string, string>
) => {
    if (!token) return;

    const notification: any = {
        token,

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
                        title,
                        body,
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
