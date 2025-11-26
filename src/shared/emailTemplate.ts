import { IResetPassword } from '../types/emailTamplate';

// Interface for resale ticket purchase
export interface IResaleTicket {
  ticketType: string;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
}

// Interface for new ticket purchase (with discount support)
export interface INewTicket {
  ticketType: string;
  quantity: number;
  price: number;
  discountPerTicket?: number;
  finalPricePerTicket: number;
}

// Email payload for resale tickets
export interface IResalePurchaseEmail {
  name: string;
  email: string;
  totalTicket: IResaleTicket[];
  totalAmount: number;
}

// Email payload for new tickets (with discount)
export interface INewPurchaseEmail {
  name: string;
  email: string;
  totalTicket: INewTicket[];
  totalAmount: number;
}

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

          <p style="font-size: 14px;">If you didn't request this, please ignore this email.</p>
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
                If you didn't request this, you can safely ignore this email.
              </p>
          </div>
      </div>
    </body>
    `
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

// Email template for RESALE ticket purchase (simple)
const resaleTicketPurchaseEmail = (data: IResalePurchaseEmail) => {
  const { name, email, totalTicket, totalAmount } = data;

  const ticketRows = totalTicket
    .map(
      (ticket) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">
        ${ticket.ticketType}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${ticket.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        $${ticket.pricePerTicket.toFixed(2)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
        $${ticket.totalPrice.toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Purchase Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 0;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <tr>
                <td style="background: linear-gradient(135deg, #277E16 0%, #1a5d0f 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    🎉 Ticket Purchase Confirmed!
                  </h1>
                  <p style="margin: 10px 0 0; color: #e0ffe0; font-size: 16px;">
                    Your tickets are ready
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 30px 20px;">
                  <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 22px;">
                    Hello ${name}! 👋
                  </h2>
                  <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                    Thank you for your purchase! Your ticket(s) have been successfully confirmed and are now available in your account.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 30px 30px;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                          Ticket Type
                        </th>
                        <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                          Quantity
                        </th>
                        <th style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                          Price/Unit
                        </th>
                        <th style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${ticketRows}
                    </tbody>
                    <tfoot>
                      <tr style="background-color: #f9fafb;">
                        <td colspan="3" style="padding: 16px 12px; text-align: right; font-size: 16px; font-weight: 700; color: #1f2937;">
                          Total Amount:
                        </td>
                        <td style="padding: 16px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #277E16;">
                          $${totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 30px 30px;">
                  <div style="background-color: #f0fdf4; border-left: 4px solid #277E16; padding: 16px; border-radius: 4px;">
                    <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                      <strong>📧 Email:</strong> ${email}<br>
                      <strong>📅 Purchase Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 30px 30px; text-align: center;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #277E16 0%, #1a5d0f 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    View My Tickets
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                    Need help? Contact our support team
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} MainLand Events. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    to: email,
    subject: '🎉 Ticket Purchase Confirmation - Your Tickets Are Ready!',
    html: htmlContent,
  };
};

// Email template for NEW ticket purchase (with discount support)
const newTicketPurchaseEmail = (data: INewPurchaseEmail) => {
  const { name, email, totalTicket, totalAmount } = data;

  const hasDiscount = totalTicket.some(t => t.discountPerTicket && t.discountPerTicket > 0);

  const ticketRows = totalTicket
    .map((ticket) => {
      const ticketHasDiscount = ticket.discountPerTicket && ticket.discountPerTicket > 0;
      
      return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">
        ${ticket.ticketType}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${ticket.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${ticketHasDiscount 
          ? `<span style="text-decoration: line-through; color: #9ca3af;">$${ticket.price.toFixed(2)}</span>
             <br><span style="color: #277E16; font-weight: bold;">$${ticket.finalPricePerTicket.toFixed(2)}</span>`
          : `$${ticket.finalPricePerTicket.toFixed(2)}`
        }
      </td>
      ${hasDiscount 
        ? `<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">
            ${ticketHasDiscount ? `-$${ticket.discountPerTicket!.toFixed(2)}` : '-'}
           </td>` 
        : ''}
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
        $${(ticket.finalPricePerTicket * ticket.quantity).toFixed(2)}
      </td>
    </tr>
  `;
    })
    .join('');

  const totalSavings = totalTicket.reduce((acc, ticket) => {
    const discount = ticket.discountPerTicket || 0;
    return acc + (discount * ticket.quantity);
  }, 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Purchase Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 0;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <tr>
                <td style="background: linear-gradient(135deg, #277E16 0%, #1a5d0f 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    🎉 Ticket Purchase Confirmed!
                  </h1>
                  <p style="margin: 10px 0 0; color: #e0ffe0; font-size: 16px;">
                    Your tickets are ready
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px 30px 20px;">
                  <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 22px;">
                    Hello ${name}! 👋
                  </h2>
                  <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                    Thank you for your purchase! Your ticket(s) have been successfully confirmed and are now available in your account.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 30px 30px;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                          Ticket Type
                        </th>
                        <th style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                          Qty
                        </th>
                        <th style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                          Price
                        </th>
                        ${hasDiscount 
                          ? '<th style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Discount</th>' 
                          : ''}
                        <th style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${ticketRows}
                    </tbody>
                    <tfoot>
                      <tr style="background-color: #f9fafb;">
                        <td colspan="${hasDiscount ? '4' : '3'}" style="padding: 16px 12px; text-align: right; font-size: 16px; font-weight: 700; color: #1f2937;">
                          Total Amount:
                        </td>
                        <td style="padding: 16px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #277E16;">
                          $${totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </td>
              </tr>

              ${totalSavings > 0 
                ? `<tr>
                    <td style="padding: 0 30px 20px;">
                      <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px;">
                        <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">
                          🎉 You saved $${totalSavings.toFixed(2)}!
                        </p>
                      </div>
                    </td>
                  </tr>` 
                : ''}

              <tr>
                <td style="padding: 0 30px 30px;">
                  <div style="background-color: #f0fdf4; border-left: 4px solid #277E16; padding: 16px; border-radius: 4px;">
                    <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                      <strong>📧 Email:</strong> ${email}<br>
                      <strong>📅 Purchase Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 30px 30px; text-align: center;">
                  <a href="#" style="display: inline-block; background: linear-gradient(135deg, #277E16 0%, #1a5d0f 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    View My Tickets
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                    Need help? Contact our support team
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} MainLand Events. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    to: email,
    subject: '🎉 Ticket Purchase Confirmation - Your Tickets Are Ready!',
    html: htmlContent,
  };
};

export const emailTemplate = {
  createAccount,
  resetPassword,
  resendOtpTemplate,
  resaleTicketPurchaseEmail,   
  newTicketPurchaseEmail,       
};