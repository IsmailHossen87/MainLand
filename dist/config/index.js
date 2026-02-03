"use strict";
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.join(process.cwd(), '.env') });
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// export const fireBaseInfo = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) : null;
// export default {
//   ip_address: process.env.IP_ADDRESS,
//   database_url: process.env.DATABASE_URL,
//   node_env: process.env.NODE_ENV,
//   FRONTEND_URL: process.env.FRONTEND_URL,
//   FRONTEND_URL_DASHBOARD: process.env.FRONTEND_URL_DASHBOARD,
//   BACKEND_URL: process.env.BACKEND_URL,
//   port: process.env.PORT,
//   GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
//   GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
//   GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
//   bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
//   jwt: {
//     jwt_secret: process.env.JWT_SECRET,
//     jwt_expire_in: process.env.JWT_EXPIRE_IN,
//     jwt_refresh_in: process.env.JWT_REFREST_IN,
//   },
//   email: {
//     from: process.env.EMAIL_FROM,
//     user: process.env.EMAIL_USER,
//     port: process.env.EMAIL_PORT,
//     host: process.env.EMAIL_HOST,
//     pass: process.env.EMAIL_PASS,
//   },
//   stripe: {
//     stripe_secret_key: process.env.STRIPE_SECRET_KYE,
//     success_url: process.env.STRIPE_SUCCESS_URL,
//     cancel_url: process.env.STRIPE_CANCLE_URL,
//     stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
//     stripe_webhook_url: process.env.STRIPE_WEBHOOK_URL,
//     stripe_product_id: process.env.STRIPE_PRODUCT_ID,
//   },
//   super_admin: {
//     email: process.env.SUPER_ADMIN_EMAIL,
//     password: process.env.SUPER_ADMIN_PASSWORD,
//   },
//   REDIS_HOST: process.env.REDIS_HOST,
//   REDIS_PORT: process.env.REDIS_PORT,
//   REDIS_USERNAME: process.env.REDIS_USERNAME,
//   REDIS_PASSWORD: process.env.REDIS_PASSWORD,
//   fireBaseInfo
// };
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
// Parse Firebase service account JSON
const firebaseInfo = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};
exports.default = {
    ip_address: process.env.IP_ADDRESS,
    database_url: process.env.DATABASE_URL,
    node_env: process.env.NODE_ENV,
    FRONTEND_URL: process.env.FRONTEND_URL,
    FRONTEND_URL_DASHBOARD: process.env.FRONTEND_URL_DASHBOARD,
    BACKEND_URL: process.env.BACKEND_URL,
    port: process.env.PORT,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    jwt: {
        jwt_secret: process.env.JWT_SECRET,
        jwt_expire_in: process.env.JWT_EXPIRE_IN,
        jwt_refresh_in: process.env.JWT_REFRESH_IN, // typo fix: REFREST -> REFRESH
    },
    email: {
        from: process.env.EMAIL_FROM,
        user: process.env.EMAIL_USER,
        port: process.env.EMAIL_PORT,
        host: process.env.EMAIL_HOST,
        pass: process.env.EMAIL_PASS,
    },
    stripe: {
        stripe_secret_key: process.env.STRIPE_SECRET_KEY, // typo fix: KYE -> KEY
        success_url: process.env.STRIPE_SUCCESS_URL,
        cancel_url: process.env.STRIPE_CANCEL_URL, // typo fix: CANCLE -> CANCEL
        stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
        stripe_webhook_url: process.env.STRIPE_WEBHOOK_URL,
        stripe_product_id: process.env.STRIPE_PRODUCT_ID,
    },
    super_admin: {
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
    },
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_USERNAME: process.env.REDIS_USERNAME,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    firebaseInfo,
};
