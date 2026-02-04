import admin from "firebase-admin";
import config from "../config";
const serviceAccount = config.firebaseInfo;

if (!serviceAccount) {
    throw new Error("Firebase configuration is not properly defined in .env");
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

export const firebaseAdmin = admin;