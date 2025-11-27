import crypto from "crypto";


export const generateOTP = (): number => {
  return Math.floor(100000 + Math.random() * 900000);
};


export default generateOTP;




export const generateEventCode = (eventId: string) => {
  const now = Date.now().toString();

  // Step 1: Create hash from eventId + currentTime
  const hash = crypto.createHash("sha256").update(eventId + now).digest("hex");

  // Step 2: Convert 8 chars → number → take 6 digits
  const code = parseInt(hash.substring(0, 8), 16)
    .toString()
    .slice(0, 6); // 6 digits

  return code;
};

