import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';


const generateQRFromObject = async (data: any, fileName: string = 'subscription_qr_code') => {
     try {
          // Extract only essential information for the QR code
          const qrData = {
               userId: data.userId,
               eventId:data.eventId,
          };


          // Format the full object data into a table-like string (for display purposes)
          const tableData = `
               userId : ${qrData.userId}
               eventId : ${qrData.eventId}
          `;

          // Ensure uploads/image directory exists
          const uploadsDir = path.join(process.cwd(), 'uploads', 'image');

          if (!fs.existsSync(uploadsDir)) {
               fs.mkdirSync(uploadsDir, { recursive: true });
          }

          // Generate a unique file name
          const safeFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
          const filePath = path.join(uploadsDir, `${safeFileName}_${Date.now()}.png`);
          const relativePath = `/image/${path.basename(filePath)}`;

          // Generate and save the QR code as an image file
          await QRCode.toFile(filePath, tableData, {
               type: 'png',
               errorCorrectionLevel: 'H',
               margin: 1,
               scale: 8,
          });

          console.log(`✅ QR Code generated at: ${filePath}`);

          return {
               qrImagePath: relativePath
          };
     } catch (error) {
          console.error('❌ Error generating QR code:', error);
          throw new Error('Failed to generate QR code. The data might be too large.');
     }
};


export { generateQRFromObject };