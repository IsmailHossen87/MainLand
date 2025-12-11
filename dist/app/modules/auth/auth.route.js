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
exports.AuthRoutes = void 0;
const user_1 = require("../../../enums/user");
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("./auth.validation");
const passport_1 = __importDefault(require("passport"));
const config_1 = __importDefault(require("../../../config"));
const router = express_1.default.Router();
router.post('/login', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createLoginZodSchema), auth_controller_1.AuthController.loginUser);
// router.post("/refresh-token", AuthValidation.getNewAccessToken)
router.post('/forget-password', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createForgetPasswordZodSchema), auth_controller_1.AuthController.forgetPassword);
router.post('/refresh-token', auth_controller_1.AuthController.refrestToken);
router.post('/verify-email', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createVerifyEmailZodSchema), auth_controller_1.AuthController.verifyEmail);
router.post("/resend-otp", auth_controller_1.AuthController.resendOtp);
router.post('/reset-password', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createResetPasswordZodSchema), auth_controller_1.AuthController.resetPassword);
router.post('/change-password', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createChangePasswordZodSchema), auth_controller_1.AuthController.changePassword);
router.get("/google", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const redirect = req.query.redirect || "/";
    passport_1.default.authenticate("google", {
        scope: ["profile", "email"],
        state: redirect,
    })(req, res, next);
}));
router.get("/google/callback", passport_1.default.authenticate("google", {
    failureRedirect: `${config_1.default.FRONTEND_URL}/login?error=There is issue with your account`,
}), auth_controller_1.AuthController.googleCallbackController);
// router.patch(
//   '/resend-otp',
//   AuthController.resendOtp
// );
exports.AuthRoutes = router;
