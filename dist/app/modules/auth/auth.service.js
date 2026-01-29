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
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const emailHelper_1 = require("../../../helpers/emailHelper");
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const cryptoToken_1 = __importDefault(require("../../../util/cryptoToken"));
const generateOTP_1 = __importDefault(require("../../../util/generateOTP"));
const resetToken_model_1 = require("../resetToken/resetToken.model");
const user_model_1 = require("../user/user.model");
const radisConfig_1 = require("../../../config/radisConfig");
const OTP_EXPIRATION = 5 * 60; // 5 minutes
// Login User
const loginUserFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload;
    const isExistUser = yield user_model_1.User.findOne({ email }).select("+password");
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    if (!isExistUser.verified) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Please verify your account, then try to login again");
    }
    const isMatch = yield user_model_1.User.isMatchPassword(password, isExistUser.password);
    if (!isMatch) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password is incorrect!");
    }
    // Create Access Token
    const accessToken = jwtHelper_1.jwtHelper.createToken({ id: isExistUser._id, role: isExistUser.role, email: isExistUser.email }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    // Create Refresh Token
    const refreshToken = jwtHelper_1.jwtHelper.refreshToken({ id: isExistUser._id, role: isExistUser.role, email: isExistUser.email }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_refresh_in);
    return {
        accessToken,
        refreshToken
    };
});
const getNewAccessToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1️⃣ Verify Refresh Token
        const decoded = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_secret);
        if (!(decoded === null || decoded === void 0 ? void 0 : decoded.id) || !(decoded === null || decoded === void 0 ? void 0 : decoded.role) || !(decoded === null || decoded === void 0 ? void 0 : decoded.email)) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid refresh token payload");
        }
        // 2️⃣ Check if user actually exists
        const user = yield user_model_1.User.findById(decoded.id);
        if (!user) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User no longer exists");
        }
        // 3️⃣ Create a new access token
        const newAccessToken = jwtHelper_1.jwtHelper.createToken({ id: user._id.toString(), role: user.role }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
        const newRefreshToken = jwtHelper_1.jwtHelper.refreshToken({ id: user._id.toString(), role: user.role }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_refresh_in);
        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken
        };
    }
    catch (error) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token");
    }
});
// Verify Email or OTP
const resendOtpToDB = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.isExistUserByEmail(email);
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    const otp = (0, generateOTP_1.default)();
    const redisKey = `otp:verify:${email}`;
    yield radisConfig_1.redisClient.setEx(redisKey, OTP_EXPIRATION, otp.toString());
    const values = { otp, email: isExistUser.email };
    const verifyEmailTemplate = emailTemplate_1.emailTemplate.resendOtpTemplate(values);
    yield emailHelper_1.emailHelper.sendEmail(verifyEmailTemplate);
    return { message: 'OTP sent to your email.' };
});
const verifyEmailToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, oneTimeCode } = payload;
    const isExistUser = yield user_model_1.User.findOne({ email }).select('+authentication');
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // Redis OTP check (both for verify and forget)
    const redisVerifyKey = `otp:verify:${email}`;
    const redisResetKey = `otp:reset:${email}`;
    let storedOTP = yield radisConfig_1.redisClient.get(redisVerifyKey);
    let redisKeyUsed = redisVerifyKey;
    if (!storedOTP) {
        storedOTP = yield radisConfig_1.redisClient.get(redisResetKey);
        redisKeyUsed = redisResetKey;
    }
    if (!storedOTP) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'OTP expired or not found');
    }
    if (storedOTP !== String(oneTimeCode)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Wrong OTP');
    }
    // OTP valid, delete from Redis
    yield radisConfig_1.redisClient.del(redisKeyUsed);
    let message;
    let data;
    if (!isExistUser.verified) {
        yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, { verified: true, authentication: { oneTimeCode: null, expireAt: null } });
        message = 'Email verified successfully.';
    }
    else {
        yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, {
            authentication: {
                isResetPassword: true,
                oneTimeCode: null,
                expireAt: null,
            },
        });
        const createToken = (0, cryptoToken_1.default)();
        yield resetToken_model_1.ResetToken.create({
            user: isExistUser._id,
            token: createToken,
            expireAt: new Date(Date.now() + 5 * 60000),
        });
        message = 'Verification successful. Use this token to reset your password.';
        data = createToken;
    }
    return { data, message };
});
// Forget Password (Send OTP)
const forgetPasswordToDB = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.isExistUserByEmail(email);
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    const otp = (0, generateOTP_1.default)();
    const redisKey = `otp:reset:${email}`;
    yield radisConfig_1.redisClient.setEx(redisKey, OTP_EXPIRATION, otp.toString());
    const values = { otp, email: isExistUser.email };
    const forgetPasswordTemplate = emailTemplate_1.emailTemplate.resetPassword(values);
    yield emailHelper_1.emailHelper.sendEmail(forgetPasswordTemplate);
    return { message: 'OTP sent to your email.' };
});
// Reset Password
const resetPasswordToDB = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { newPassword, confirmPassword } = payload;
    const isExistToken = yield resetToken_model_1.ResetToken.isExistToken(token);
    if (!isExistToken) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized.');
    }
    const isExistUser = yield user_model_1.User.findById(isExistToken.user).select('+authentication');
    if (!((_a = isExistUser === null || isExistUser === void 0 ? void 0 : isExistUser.authentication) === null || _a === void 0 ? void 0 : _a.isResetPassword)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "You don't have permission to reset the password. Please try 'Forgot Password' again.");
    }
    const isValid = yield resetToken_model_1.ResetToken.isExpireToken(token);
    if (!isValid) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Token expired. Please try again.');
    }
    if (newPassword !== confirmPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "New password and Confirm password don't match!");
    }
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    const updateData = {
        password: hashPassword,
        authentication: { isResetPassword: false },
    };
    yield user_model_1.User.findOneAndUpdate({ _id: isExistToken.user }, updateData, {
        new: true,
    });
});
// Change Password
const changePasswordToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentPassword, newPassword, confirmPassword } = payload;
    const isExistUser = yield user_model_1.User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    const isMatch = yield user_model_1.User.isMatchPassword(currentPassword, isExistUser.password);
    if (!isMatch) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect.');
    }
    if (currentPassword === newPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please choose a different password.');
    }
    if (newPassword !== confirmPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password and Confirm password don't match.");
    }
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    yield user_model_1.User.findOneAndUpdate({ _id: user.id }, { password: hashPassword }, { new: true });
});
exports.AuthService = {
    verifyEmailToDB,
    loginUserFromDB,
    forgetPasswordToDB,
    resetPasswordToDB,
    changePasswordToDB,
    resendOtpToDB,
    getNewAccessToken
};
