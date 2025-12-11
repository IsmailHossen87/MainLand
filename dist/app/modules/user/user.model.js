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
exports.User = exports.MainlandFee = exports.isDeleted = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = require("mongoose");
const user_1 = require("../../../enums/user");
const authProviderSchema = new mongoose_1.Schema({
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
});
// IS DELETED SCHEMA
const isDeletedSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    deleteReason: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
exports.isDeleted = (0, mongoose_1.model)('isDeleted', isDeletedSchema);
// MAINLAND FEE
const mainlandFeeSchema = new mongoose_1.Schema({
    mainlandFee: {
        type: Number,
        default: 1,
        min: [0.01, 'Mainland fee must be greater than 0'],
        max: [100, 'Mainland fee cannot be greater than 100'],
        validate: {
            validator: function (value) {
                return value > 0 && value <= 100;
            },
            message: 'Mainland fee must be between 0.01 and 100'
        }
    },
}, { timestamps: true, versionKey: false });
exports.MainlandFee = (0, mongoose_1.model)('MainlandFee', mainlandFeeSchema);
// USER SCHEMA
const userSchema = new mongoose_1.Schema({
    name: {
        type: String
    },
    role: {
        type: String,
        enum: Object.values(user_1.USER_ROLES),
        default: user_1.USER_ROLES.USER,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    auths: [authProviderSchema],
    image: {
        type: String,
        default: 'https://i.ibb.co/z5YHLV9/profile.png',
    },
    joinedDate: { type: Date, default: Date.now },
    stripeAccountInfo: {
        stripeCustomerId: {
            type: String,
            required: false,
        },
        stripeAccountId: {
            type: String,
            required: false,
        },
        loginUrl: {
            type: String,
            required: false,
        },
    },
    status: {
        type: String,
        enum: ['Active', 'Blocked'],
        default: 'Active',
    },
    sellAmount: {
        type: Number,
        default: 0,
    },
    withDrawAmount: {
        type: Number,
        default: 0,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    terAndCondition: {
        type: Boolean,
        default: false,
    },
    personalInfo: {
        firstName: { type: String, default: '' },
        lastName: { type: String, default: '' },
        phone: { type: String, default: '' },
        dateOfBirth: { type: Date }
    },
    address: {
        country: { type: String, default: 'United States' },
        city: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        street: { type: String, default: '' },
    },
    notification: {
        isSellTicketNotificationEnabled: { type: Boolean, default: true },
        isMessageNotificationEnabled: { type: Boolean, default: true },
        isPublishEventNotificationEnabled: { type: Boolean, default: true },
        isWithdrawMoneyNotificationEnabled: { type: Boolean, default: true },
    },
    authentication: {
        type: {
            isResetPassword: { type: Boolean, default: false },
            oneTimeCode: { type: Number, default: null },
            expireAt: { type: Date, default: null },
        },
        select: 0,
    },
}, { timestamps: true, versionKey: false });
// check user exists
userSchema.statics.isExistUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield exports.User.findById(id);
});
userSchema.statics.isExistUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield exports.User.findOne({ email });
});
// match password
userSchema.statics.isMatchPassword = (password, hashPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcrypt_1.default.compare(password, hashPassword);
});
exports.User = (0, mongoose_1.model)('User', userSchema);
