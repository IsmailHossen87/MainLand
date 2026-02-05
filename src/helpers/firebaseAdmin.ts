
import { Notification } from "../app/modules/Notification/notification.model";
import { firebaseAdmin } from "./firebase";



// export const firebaseNotificationBuilder = ({ user, title, body, image = "", chatId = '', eventId = '', type = '', avatar = '' }: {
//     user: any;
//     title: string;
//     body: string;
//     image?: string;
//     chatId?: string;
//     eventId?: string;
//     type?: string;
//     avatar?: string;
// }) => {

//     const sound = user.isSoundNotificationEnabled ? "default" : undefined;
//     const notification = sendFirebaseNotification(
//         user.fcmToken,
//         sound,
//         {
//             isSoundNotificationEnabled: `${user.isSoundNotificationEnabled}`,
//             isVibrationNotificationEnabled: `${user.isVibrationNotificationEnabled}`,
//             title,
//             body,
//             image,
//             chatId,
//             eventId,
//             type,
//             avatar
//         }
//     );

//     return notification;
// };


// export const sendFirebaseNotification = async (
//     token: string,
//     sound: string | undefined,
//     data?: Record<string, string>
// ) => {
//     if (!token) return;

//     const notification: any = {
//         token,
//         // ❌ notification field নেই - শুধু data
//         data: data ?? {},
//         android: {
//             priority: "high",
//             // ❌ android.notification নেই
//         },
//         apns: {
//             headers: {
//                 "apns-push-type": "alert",
//                 "apns-priority": "10",
//             },
//             payload: {
//                 aps: {
//                     alert: {
//                         title: data?.title,
//                         body: data?.body,
//                     },
//                     ...(sound && { sound }),
//                 },
//             },
//         },
//     };

//     console.log("🚀 notification payload:", JSON.stringify(notification, null, 2));

//     try {
//         const result = await firebaseAdmin.messaging().send(notification);
//         console.log("✅ Firebase Response:", result);
//         return result;
//     } catch (error) {
//         console.error("❌ Firebase Error:", error);
//         throw error;
//     }
// };





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
        sound,
        {
            isSoundNotificationEnabled: `${user.isSoundNotificationEnabled}`,
            isVibrationNotificationEnabled: `${user.isVibrationNotificationEnabled}`,
            title,
            body,
            image,
            chatId,
            eventId,
            type,
            avatar
        }
    );

    return notification;
};


export const sendFirebaseNotification = async (
    token: string,
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
                        title: data?.title,
                        body: data?.body,
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
