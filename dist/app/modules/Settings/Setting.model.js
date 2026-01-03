"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = exports.Settings = exports.SettingType = exports.IEnum = void 0;
const mongoose_1 = require("mongoose");
var IEnum;
(function (IEnum) {
    IEnum["Vanue"] = "vanue";
    IEnum["User"] = "user";
})(IEnum || (exports.IEnum = IEnum = {}));
var SettingType;
(function (SettingType) {
    SettingType["TermsAndConditions"] = "terms_and_conditions";
    SettingType["PrivacyPolicy"] = "privacy_policy";
    SettingType["AboutUs"] = "about_us";
    SettingType["Faq"] = "faq";
    SettingType["Contact"] = "contact";
})(SettingType || (exports.SettingType = SettingType = {}));
const SettingsSchema = new mongoose_1.Schema({
    type: { type: String, enum: SettingType, required: true },
    title: { type: String, default: "" },
    faqType: { type: String, enum: IEnum, default: "" },
    content: { type: String, default: "" },
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
}, { timestamps: true, versionKey: false });
exports.Settings = (0, mongoose_1.model)("Settings", SettingsSchema);
const ContactSchema = new mongoose_1.Schema({
    userId: { type: String, default: "" },
    email: { type: String, default: "" },
    status: { type: String, enum: ['pending', 'solved', 'rejected'], default: "pending" },
    message: { type: String, default: "" },
    adminMessage: { type: String, default: "" },
    adminId: { type: String, default: "" },
}, { timestamps: true, versionKey: false });
exports.Contact = (0, mongoose_1.model)("Contact", ContactSchema);
