import { IResetPassword } from '../types/emailTamplate';


// emailTemplate.ts

// ✅ Correct Interface for Single Ticket
export interface ITicket {
  ticketType: string;
  quantity: number;
  price: number;                   
  discountPerTicket?: number;    
  finalPricePerTicket: number;    
}

// ✅ Correct Interface for Email Payload
export interface IPurchaseEmail {
  name: string;
  email: string;
  totalTicket: ITicket[];   
  totalAmount: number;          
}

const ticketPurchaseEmail = (values: IPurchaseEmail) => {
  // Generate ticket rows with discount handling
  const ticketsHtml = values.totalTicket.length
    ? `<table style="width:100%; border-collapse:collapse; margin-top:10px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:8px; background:#f8f8f8;">Ticket Type</th>
            <th style="border:1px solid #ddd; padding:8px; background:#f8f8f8;">Quantity</th>
            <th style="border:1px solid #ddd; padding:8px; background:#f8f8f8;">Price</th>
            ${values.totalTicket.some(t => t.discountPerTicket && t.discountPerTicket > 0) 
              ? '<th style="border:1px solid #ddd; padding:8px; background:#f8f8f8;">Discount</th>' 
              : ''}
            <th style="border:1px solid #ddd; padding:8px; background:#f8f8f8;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${values.totalTicket
            .map(ticket => {
              const hasDiscount = ticket.discountPerTicket && ticket.discountPerTicket > 0;
              const showDiscountColumn = values.totalTicket.some(t => t.discountPerTicket && t.discountPerTicket > 0);
              
              return `
                <tr>
                  <td style="border:1px solid #ddd; padding:8px;">${ticket.ticketType}</td>
                  <td style="border:1px solid #ddd; padding:8px; text-align:center;">${ticket.quantity}</td>
                  <td style="border:1px solid #ddd; padding:8px; text-align:right;">
                    ${hasDiscount 
                      ? `<span style="text-decoration:line-through; color:#999;">$${ticket.price.toFixed(2)}</span>
                         <br><span style="color:#e74c3c; font-weight:bold;">$${ticket.finalPricePerTicket.toFixed(2)}</span>`
                      : `$${ticket.finalPricePerTicket.toFixed(2)}`
                    }
                  </td>
                  ${showDiscountColumn 
                    ? `<td style="border:1px solid #ddd; padding:8px; text-align:right; color:#27ae60;">
                        ${hasDiscount ? `-$${ticket.discountPerTicket!.toFixed(2)}` : '-'}
                       </td>` 
                    : ''}
                  <td style="border:1px solid #ddd; padding:8px; text-align:right; font-weight:bold;">
                    $${(ticket.finalPricePerTicket * ticket.quantity).toFixed(2)}
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>`
    : '<p>No tickets purchased.</p>';

  // Calculate total savings if any discount exists
  const totalSavings = values.totalTicket.reduce((acc, ticket) => {
    const discount = ticket.discountPerTicket || 0;
    return acc + (discount * ticket.quantity);
  }, 0);

  const hasSavings = totalSavings > 0;

  return {
    to: values.email,
    subject: `🎟️ Your MainLand Ticket Purchase Summary`,
    html: `
      <div style="font-family:Arial,sans-serif; padding:20px; background:#f4f4f4;">
        <div style="max-width:600px; margin:0 auto; background:#fff; padding:30px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color:#333; margin-bottom:10px;">Hello ${values.name},</h2>
          <p style="color:#666; font-size:16px;">Thank you for purchasing tickets from <strong>MainLand Events</strong>! Here's your order summary:</p>
          
          ${ticketsHtml}

          ${hasSavings 
            ? `<div style="margin-top:15px; padding:10px; background:#d4edda; border-left:4px solid #28a745; border-radius:4px;">
                <p style="margin:0; color:#155724;">
                  <strong>🎉 You saved: $${totalSavings.toFixed(2)}</strong>
                </p>
               </div>` 
            : ''}

          <div style="margin-top:20px; padding:15px; background:#f8f9fa; border-radius:4px;">
            <p style="margin:0; font-size:18px; color:#333;">
              <strong>Total Amount Paid:</strong> 
              <span style="color:#e74c3c; font-size:24px; font-weight:bold;">$${values.totalAmount.toFixed(2)}</span>
            </p>
          </div>

          <p style="margin-top:20px; color:#666;">We are excited to have you at the event!</p>
          <p style="color:#999; font-size:14px; margin-top:30px; border-top:1px solid #eee; padding-top:20px;">
            — MainLand Events Team 🎉
          </p>
        </div>
      </div>
    `,
  };
};




const createAccount = (values: { name: string; email: string; otp: number }) => {
  return {
    to: values.email,
    subject: 'Verify Your MainLand Account',
    html: `
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
      <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <img src="https://ibb.co.com/gLb5SyJ5" alt="MainLand Logo" style="display: block; margin: 0 auto 20px; width:150px" />
          <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px;">Hello ${values.name}, Welcome to MainLand!</h2>

          <div style="text-align: center;">
              <p style="font-size: 16px;">Your verification code is:</p>
              <div style="background-color: #277E16; width: 80px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">
                ${values.otp}
              </div>

              <p style="font-size: 16px;">This OTP is valid for 3 minutes.</p>
          </div>

          <p style="font-size: 14px;">If you didn’t request this, please ignore this email.</p>
      </div>
    </body>
    `
  };
};


const resetPassword = (values: IResetPassword) => {
  return {
    to: values.email,
    subject: 'Reset Your MainLand Account Password',
    html: `
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #555;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <img src="https://ibb.co.com/gLb5SyJ5" alt="MainLand Logo" style="display: block; margin: 0 auto 20px; width:150px" />

          <div style="text-align:center;">
              <p>Your password reset verification code:</p>
              <div style="background:#277E16; width:80px; margin:auto; padding:10px; border-radius:8px; color:#fff; font-size:25px; letter-spacing:2px;">
                ${values.otp}
              </div>
              <p>This code will expire in 3 minutes.</p>
              <p style="font-size:13px; color:#888; text-align:left;">
                If you didn’t request this, you can safely ignore this email.
              </p>
          </div>
      </div>
    </body>
    `
  };
};


const donationConfirmation = (values: { 
  name: string;
  email: string;
  amount: number;
  causeName: string | undefined;
  causeImage: string | undefined;
}) => {
  return {
    to: values.email,
    subject: 'Your MainLand Donation Receipt ✔',
    html: `
      <body style="font-family: Arial; background:#f9f9f9; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; padding:20px; border-radius:10px;">
            <img src="https://ibb.co.com/gLb5SyJ5" alt="MainLand Logo" style="display:block; margin:auto; width:150px;" />

            <h2 style="color:#277E16; text-align:center;">
              Thank you, ${values.name}, for supporting ${values.causeName}!
            </h2>

            <div style="text-align:center;">
              <img src="http://10.10.7.23:5000${values.causeImage}" 
                   style="width:100%; max-width:400px; border-radius:10px;" />
            </div>

            <p style="font-size:16px;">Donation Amount: <strong>$${values.amount}</strong></p>
            <p>Your contribution helps us continue supporting meaningful causes.</p>

            <p style="font-size:14px;">For any questions, feel free to contact our support team.</p>
        </div>
      </body>
    `,
  };
};


const resendOtpTemplate = (values: { otp: string | number; email: string }) => {
  return {
    to: values.email,
    subject: "Your OTP Code - MainLand Verification",
    html: `
      <body style="font-family: Arial; background:#f6f6f6; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; padding:25px; border-radius:10px;">
          
          <div style="text-align:center;">
            <img src="https://ibb.co.com/gLb5SyJ5" alt="MainLand Logo" style="width:140px;" />
          </div>

          <h2 style="color:#277E16; text-align:center;">Your Resent OTP Code</h2>

          <p style="text-align:center;">Use the code below to continue verifying your MainLand account.</p>

          <div style="text-align:center; margin:25px 0;">
            <div style="display:inline-block; background:#277E16; color:white; padding:15px 25px; border-radius:8px; font-size:28px; font-weight:bold; letter-spacing:3px;">
              ${values.otp}
            </div>
          </div>

          <p style="text-align:center; color:#666;">This OTP will expire in <strong>5 minutes</strong>.</p>
        </div>
      </body>
    `,
  };
};


export const emailTemplate = {
  createAccount,
  resetPassword,
  donationConfirmation,
  ticketPurchaseEmail,
  resendOtpTemplate
};
