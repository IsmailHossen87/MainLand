"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEventCode = exports.generateOTP = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
};
exports.generateOTP = generateOTP;
exports.default = exports.generateOTP;
const generateRandomPrefix = (length = 3) => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
};
const generateEventCode = (eventId) => {
    const now = Date.now().toString();
    // 1️⃣ Create hash from eventId + timestamp
    const hash = crypto_1.default.createHash("sha256").update(eventId + now).digest("hex");
    // 2️⃣ Convert first 8 chars → number → take 5 digits
    let numericPart = parseInt(hash.substring(0, 8), 16).toString().slice(0, 5);
    // Ensure numeric part is 5 digits
    if (numericPart.length < 5) {
        numericPart = numericPart.padStart(5, Math.floor(Math.random() * 9).toString());
    }
    // 3️⃣ Generate random 3-letter prefix
    const prefix = generateRandomPrefix(3);
    // 4️⃣ Combine prefix + numeric part
    return `${prefix}-${numericPart}`;
};
exports.generateEventCode = generateEventCode;
