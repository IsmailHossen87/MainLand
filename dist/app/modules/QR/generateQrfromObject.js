"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRFromObject = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
const generateQRFromObject = (data_1, ...args_1) => __awaiter(void 0, [data_1, ...args_1], void 0, function* (data, fileName = 'subscription_qr_code') {
    try {
        // Extract only essential information for the QR code
        const qrData = {
            userId: data.userId,
            eventId: data.eventId,
        };
        // Format the full object data into a table-like string (for display purposes)
        const tableData = `
               userId : ${qrData.userId}
               eventId : ${qrData.eventId}
          `;
        // Ensure uploads/image directory exists
        const uploadsDir = path_1.default.join(process.cwd(), 'uploads', 'image');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        // Generate a unique file name
        const safeFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filePath = path_1.default.join(uploadsDir, `${safeFileName}_${Date.now()}.png`);
        const relativePath = `/image/${path_1.default.basename(filePath)}`;
        // Generate and save the QR code as an image file
        yield qrcode_1.default.toFile(filePath, tableData, {
            type: 'png',
            errorCorrectionLevel: 'H',
            margin: 1,
            scale: 8,
        });
        console.log(`✅ QR Code generated at: ${filePath}`);
        return {
            qrImagePath: relativePath
        };
    }
    catch (error) {
        console.error('❌ Error generating QR code:', error);
        throw new Error('Failed to generate QR code. The data might be too large.');
    }
});
exports.generateQRFromObject = generateQRFromObject;
