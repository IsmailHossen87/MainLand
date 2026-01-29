import { firebaseAdmin } from "./firebase";


export const sendFirebaseNotification = async (
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
) => {
    if (!token) return;

    await firebaseAdmin.messaging().send({
        token,
        notification: {
            title,
            body,
        },
        data,
    });
};
