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
exports.emailHelper = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../shared/logger");
const transporter = nodemailer_1.default.createTransport({
    host: config_1.default.email.host,
    port: Number(config_1.default.email.port),
    secure: false,
    auth: {
        user: config_1.default.email.user,
        pass: config_1.default.email.pass,
    },
});
const sendEmail = (values) => __awaiter(void 0, void 0, void 0, function* () {
    // ✅ Type guard function
    const isValidEmail = (email) => {
        return typeof email === 'string' && email.trim().length > 0 && email.includes('@');
    };
    // Validate recipient
    if (!isValidEmail(values.to)) {
        logger_1.errorLogger.error('Email Error: Invalid recipient email', { to: values.to });
        throw new Error('Valid recipient email address is required');
    }
    // Validate subject and html
    if (!values.subject || !values.html) {
        logger_1.errorLogger.error('Email Error: Missing required fields');
        throw new Error('Email subject and html content are required');
    }
    try {
        const info = yield transporter.sendMail({
            from: `"MainLand Platform" <${config_1.default.email.from}>`,
            to: values.to.trim(),
            subject: values.subject,
            html: values.html,
        });
        logger_1.logger.info(`✅ Email sent: ${values.subject}`, {
            to: values.to,
            messageId: info.messageId,
        });
        return info;
    }
    catch (error) {
        logger_1.errorLogger.error('❌ Email failed:', error.message);
        throw new Error(`Failed to send email: ${error.message}`);
    }
});
exports.emailHelper = {
    sendEmail,
};
