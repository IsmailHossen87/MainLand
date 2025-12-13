"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingRouter = void 0;
const express_1 = require("express");
const SettingController_1 = require("./SettingController");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const router = (0, express_1.Router)();
router.put("/", SettingController_1.SettingController.updateSetting);
router.post("/faq", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), SettingController_1.SettingController.faqCreate);
router.post("/contact", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), SettingController_1.SettingController.contactCreate);
router.get("/contact", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), SettingController_1.SettingController.getContact);
router.delete("/delete-contact/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), SettingController_1.SettingController.deleteContact);
router.patch("/contact-email/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), SettingController_1.SettingController.contactEmail);
router.get("/contact/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), SettingController_1.SettingController.getContactById);
// faq
router.get("/faq/:faqType", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), SettingController_1.SettingController.getQuestion);
router.patch("/faq/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), SettingController_1.SettingController.faqUpdate);
router.delete("/faq/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN), SettingController_1.SettingController.faqDelete);
router.get("/faq/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.ORGANIZER, user_1.USER_ROLES.USER), SettingController_1.SettingController.getQuestionById);
router.get("/:key", SettingController_1.SettingController.getSpecificSetting);
exports.SettingRouter = router;
