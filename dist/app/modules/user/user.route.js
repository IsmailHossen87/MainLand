"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const fileUploadHandler_1 = __importDefault(require("../../middlewares/fileUploadHandler"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const ParseFormData_1 = require("../../middlewares/ParseFormData");
const router = express_1.default.Router();
const allUser = (0, auth_1.default)(user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER);
router
    .route('/profile')
    .get(allUser, user_controller_1.UserController.getUserProfile)
    .patch(allUser, (0, fileUploadHandler_1.default)(), ParseFormData_1.parseFormDataMiddleware, (0, validateRequest_1.default)(user_validation_1.UserValidation.updateUserZodSchema), user_controller_1.UserController.updateProfile);
router.route('/').get(user_controller_1.UserController.getAllUser);
router.put("/mainland-fee", ((0, auth_1.default)(user_1.USER_ROLES.ADMIN)), user_controller_1.UserController.CreateAndUpdateMainlandFee);
router.get("/mainland-fee", ((0, auth_1.default)(user_1.USER_ROLES.ADMIN)), user_controller_1.UserController.getMainlandFee);
router
    .route('/create')
    .post((0, validateRequest_1.default)(user_validation_1.UserValidation.createUserZodSchema), user_controller_1.UserController.createUser);
router.route("/remove-image")
    .delete(allUser, user_controller_1.UserController.imageDelete);
router.route("/remove-account")
    .delete(allUser, user_controller_1.UserController.accountDelete);
exports.UserRoutes = router;
