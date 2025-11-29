import nodemailer from 'nodemailer';
import config from '../config';
import { errorLogger, logger } from '../shared/logger';
import { ISendEmail } from '../types/email';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port),
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});


const sendEmail = async (values: Partial<ISendEmail>) => {
  // ✅ Type guard function
  const isValidEmail = (email: any): email is string => {
    return typeof email === 'string' && email.trim().length > 0 && email.includes('@');
  };

  // Validate recipient
  if (!isValidEmail(values.to)) {
    errorLogger.error('Email Error: Invalid recipient email', { to: values.to });
    throw new Error('Valid recipient email address is required');
  }

  // Validate subject and html
  if (!values.subject || !values.html) {
    errorLogger.error('Email Error: Missing required fields');
    throw new Error('Email subject and html content are required');
  }

  try {
    const info = await transporter.sendMail({
      from: `"MainLand Platform" <${config.email.from}>`,
      to: values.to.trim(),
      subject: values.subject,
      html: values.html,
    });

    logger.info(`✅ Email sent: ${values.subject}`, {
      to: values.to,
      messageId: info.messageId,
    });

    return info;
  } catch (error: any) {
    errorLogger.error('❌ Email failed:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
export const emailHelper = {
  sendEmail,
};