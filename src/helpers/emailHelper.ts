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


const sendEmail = async (values: ISendEmail) => {
  try {
    const info = await transporter.sendMail({
      from: `"FundRaise Platform" <${config.email.from}>`,
      to: values.to,
      subject: values.subject,
      html: values.html,
    });

    logger.info('Fundraising OTP email sent successfully to:', values.to, info.accepted);
  } catch (error) {
    errorLogger.error('Fundraising Email Error:', error);
  }
};

export const emailHelper = {
  sendEmail,
};
