import admin from "firebase-admin";
import serviceAccount from "../config/firebaseServiceAccount.json";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

export const firebaseAdmin = admin;
