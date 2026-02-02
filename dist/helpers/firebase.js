"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAdmin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const config_1 = require("../config"); // তোমার config file import করো
const serviceAccount = config_1.firebaseInfo;
if (!serviceAccount) {
    throw new Error("Firebase configuration is not properly defined in .env");
}
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
    });
}
exports.firebaseAdmin = firebase_admin_1.default;
