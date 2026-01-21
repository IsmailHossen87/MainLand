"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAdmin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firebaseServiceAccount_json_1 = __importDefault(require("../config/firebaseServiceAccount.json"));
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(firebaseServiceAccount_json_1.default),
    });
}
exports.firebaseAdmin = firebase_admin_1.default;
