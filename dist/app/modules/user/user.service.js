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
exports.UserService = exports.generateRandomEmail = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const user_model_1 = require("./user.model");
const stripe_config_1 = __importDefault(require("../../config/stripe.config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_1 = require("../../../enums/user");
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const constrant_1 = require("../../../shared/constrant");
const OTP_EXPIRATION = 2 * 60;
const generateRandomEmail = (name) => {
    const random = Math.floor(Math.random() * 100000);
    return `${name.toLowerCase()}${random}@gmail.com`;
};
exports.generateRandomEmail = generateRandomEmail;
const createUserToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // ✨ Password hash করা
    if (payload.password) {
        payload.password = yield bcrypt_1.default.hash(payload.password, 10);
    }
    const createUser = yield user_model_1.User.create(payload);
    if (!createUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
    }
    let stripeCustomer;
    try {
        stripeCustomer = yield stripe_config_1.default.customers.create({
            email: createUser.email,
            name: createUser.name,
        });
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create Stripe customer');
    }
    yield user_model_1.User.findOneAndUpdate({ _id: createUser._id }, {
        $set: {
            stripeAccountInfo: { stripeCustomerId: stripeCustomer.id },
        }
    });
    return createUser;
});
const getUserProfileFromDB = (user, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    // ✅ Mainland fee fetch koro
    const mainLandFeeData = yield user_model_1.MainlandFee.findOne();
    if (userId) {
        const isExistUser = yield user_model_1.User.isExistUserById(userId);
        if (!isExistUser) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User doesn't exist!");
        }
        return Object.assign(Object.assign({}, isExistUser.toObject ? isExistUser.toObject() : isExistUser), { mainlandFee: (mainLandFeeData === null || mainLandFeeData === void 0 ? void 0 : mainLandFeeData.mainlandFee) || 1 });
    }
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User doesn't exist!");
    }
    const userObject = isExistUser.toObject ? isExistUser.toObject() : isExistUser;
    return Object.assign(Object.assign({}, userObject), { mainlandFee: (mainLandFeeData === null || mainLandFeeData === void 0 ? void 0 : mainLandFeeData.mainlandFee) || 1 });
});
const getAllUser = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const baseQuery = user_model_1.User.find().sort({ createdAt: -1 });
    const qb = yield new QueryBuilder_1.QueryBuilder(baseQuery, query);
    const allUser = yield qb.search(constrant_1.excludeField)
        .filter()
        .dateRange()
        .sort()
        .fields()
        .paginate();
    const [meta, data] = yield Promise.all([
        allUser.getMeta(),
        allUser.build(),
    ]);
    return { meta, data };
});
const updateProfileToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User doesn't exist!");
    }
    //unlink file here
    if (payload.image) {
        (0, unlinkFile_1.default)(isExistUser.image);
    }
    const updateDoc = yield user_model_1.User.findOneAndUpdate({ _id: id }, payload, {
        new: true,
    });
    return updateDoc;
});
const imageDelete = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //unlink file here
    if (isExistUser.image) {
        (0, unlinkFile_1.default)(isExistUser.image);
    }
    const updateDoc = yield user_model_1.User.findOneAndUpdate({ _id: id }, { image: null }, {
        new: true,
    });
    return updateDoc;
});
const accountDelete = (user_2, _a) => __awaiter(void 0, [user_2, _a], void 0, function* (user, { deleteReason, password }) {
    const { id } = user;
    // 1️⃣ Check user exists
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    console.log("oldPassword", isExistUser.password);
    if (!isExistUser.password) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password not found in DB!");
    }
    // 2️⃣ Verify password
    const isMatchPassword = yield user_model_1.User.isMatchPassword(password, isExistUser.password);
    if (!isMatchPassword) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password doesn't match!");
    }
    // 3️⃣ Delete profile image (if exists)
    if (isExistUser.image) {
        (0, unlinkFile_1.default)(isExistUser.image);
    }
    // 4️⃣ Update user → anonymize
    const updateDoc = yield user_model_1.User.findOneAndUpdate({ _id: id }, {
        name: "Anonymous",
        email: (0, exports.generateRandomEmail)(isExistUser.name),
        role: user_1.USER_ROLES.DELETED,
        image: null,
    }, { new: true });
    // 5️⃣ Save deletion log
    yield user_model_1.isDeleted.create({
        userId: id,
        deleteReason,
        isDeleted: true,
    });
    return updateDoc;
});
const mainLandFee = (user, mainLandFee) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    const updateDoc = yield user_model_1.MainlandFee.findOneAndUpdate({ _id: id }, { mainlandFee: mainLandFee }, {
        new: true,
        upsert: true,
    });
    return updateDoc;
});
exports.UserService = {
    createUserToDB,
    getUserProfileFromDB,
    getAllUser,
    updateProfileToDB,
    imageDelete,
    accountDelete,
    mainLandFee
};
