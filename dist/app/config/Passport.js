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
const passport_google_oauth20_1 = require("passport-google-oauth20");
const user_model_1 = require("../modules/user/user.model");
const passport_1 = __importDefault(require("passport"));
const config_1 = __importDefault(require("../../config"));
const user_1 = require("../../enums/user");
const crypto_1 = __importDefault(require("crypto"));
// Google er jonno
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: config_1.default.GOOGLE_CLIENT_ID,
    clientSecret: config_1.default.GOOGLE_CLIENT_SECRET,
    callbackURL: config_1.default.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const email = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0].value;
        if (!email) {
            return done(null, false, { message: 'No email found ' });
        }
        let isUserExites = yield user_model_1.User.findOne({ email });
        if (isUserExites && !isUserExites.verified) {
            return done(null, false, { message: 'User is not verified' });
        }
        if (isUserExites && isUserExites.status === 'Blocked') {
            return done(null, false, {
                message: `User is ${isUserExites.status}`,
            });
        }
        if (!isUserExites) {
            isUserExites = yield user_model_1.User.create({
                email,
                name: profile.displayName,
                picture: (_b = profile.photos) === null || _b === void 0 ? void 0 : _b[0].value,
                role: user_1.USER_ROLES.USER,
                verified: true,
                password: crypto_1.default.randomBytes(20).toString('hex'),
                auths: [
                    {
                        provider: 'google',
                        providerId: profile.id,
                    },
                ],
            });
        }
        return done(null, isUserExites);
    }
    catch (error) {
        console.log('Google Strategy Error', error);
        return done(error);
    }
})));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.User.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error);
    }
}));
