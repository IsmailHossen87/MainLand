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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingService = void 0;
const user_1 = require("../../../enums/user");
const Setting_model_1 = require("./Setting.model");
const QueryBuilder_1 = require("../../builder/QueryBuilder");
const constrant_1 = require("../../../shared/constrant");
const user_model_1 = require("../user/user.model");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const emailHelper_1 = require("../../../helpers/emailHelper");
// Create or update single settings document
const updateSetting = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, title, content } = data;
    const result = yield Setting_model_1.Settings.findOneAndUpdate({ type }, { title, content }, { upsert: true, new: true });
    return result;
});
const faqSetting = (user, data) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, question, answer, faqType } = data;
    if (user_1.USER_ROLES.ADMIN != user.role) {
        throw new Error("You are not authorized to create faq");
    }
    const result = yield Setting_model_1.Settings.create({ type, question, answer, faqType, userId: user.id });
    return result;
});
const getQuestion = (user, faqType, query) => __awaiter(void 0, void 0, void 0, function* () {
    // if (USER_ROLES.ADMIN != user.role) {
    //   throw new Error("You are not authorized to get faq");
    // }
    // Base query
    const baseQuery = Setting_model_1.Settings.find({
        type: Setting_model_1.SettingType.Faq,
        faqType,
        question: { $ne: "" }
    });
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, query);
    const allQuestion = queryBuilder
        .search(["question", "answer"])
        .filter()
        .dateRange()
        .sort()
        .paginate();
    // Check the final query filter
    const builtQuery = allQuestion.modelQuery;
    console.log("🎯 Final filter:", JSON.stringify(builtQuery.getFilter(), null, 2));
    const [meta, data] = yield Promise.all([
        allQuestion.getMeta(),
        allQuestion.build(),
    ]);
    console.log("✅ Results:", { metaTotal: meta.total, dataLength: data.length });
    return { meta, data };
});
const getQuestionById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield Setting_model_1.Settings.findById(id);
    if (!result) {
        throw new Error("Question not found");
    }
    return result;
});
const getSpecificSetting = (key) => __awaiter(void 0, void 0, void 0, function* () {
    // key কে SettingType এ convert করুন
    const setting = yield Setting_model_1.Settings.findOne({ type: key });
    if (!setting) {
        return null;
    }
    return setting;
});
const contactSetting = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    const userPayload = Object.assign(Object.assign({}, payload), { userId: user._id, email: user.email });
    const result = yield Setting_model_1.Contact.create(userPayload);
    return result;
});
const getContact = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(Setting_model_1.Contact.find(), query);
    const allContact = queryBuilder.search(constrant_1.excludeField)
        .filter()
        .dateRange()
        .sort()
        .paginate();
    const [meta, data] = yield Promise.all([allContact.getMeta(), allContact.build()]);
    return { meta, data };
});
const getContactById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield Setting_model_1.Contact.findById(id);
    if (!result) {
        throw new Error("Contact not found");
    }
    return result;
});
const contactEmail = (id, adminMessage, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate admin
    const admin = yield user_model_1.User.findById(adminId);
    if (!admin) {
        throw new Error("Admin not found");
    }
    // Find contact by ID
    const contact = yield Setting_model_1.Contact.findById(id);
    if (!contact) {
        throw new Error("Contact not found");
    }
    // Check if already solved
    if (contact.status === "solved") {
        throw new Error("This contact has already been resolved");
    }
    // Update contact with admin response
    const updateData = {
        adminMessage: adminMessage.trim(),
        status: "solved",
        adminId: admin._id
    };
    const updatedContact = yield Setting_model_1.Contact.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    if (!updatedContact) {
        throw new Error("Failed to update contact");
    }
    // Get user details for personalization
    const user = yield user_model_1.User.findById(contact.userId);
    const userName = (user === null || user === void 0 ? void 0 : user.name) || "Valued Customer";
    const values = {
        adminMessage: adminMessage.trim(),
        email: (user === null || user === void 0 ? void 0 : user.email) || "",
        name: (user === null || user === void 0 ? void 0 : user.name) || "Valued Customer",
        status: "solved",
        adminId: admin._id,
        usersMessage: contact.message,
    };
    const email = emailTemplate_1.emailTemplate.contactResponseEmail(values);
    yield emailHelper_1.emailHelper.sendEmail(email);
    return updatedContact;
});
const faqDelete = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield Setting_model_1.Settings.findByIdAndDelete(id);
    if (!result) {
        throw new Error("Faq not found");
    }
    return result;
});
const faqUpdate = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield Setting_model_1.Settings.findByIdAndUpdate(id, payload, { new: true });
    if (!result) {
        throw new Error("Faq not found");
    }
    return result;
});
const deleteContact = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield Setting_model_1.Contact.findByIdAndDelete(id);
    if (!result) {
        throw new Error("Contact not found");
    }
    return result;
});
exports.SettingService = {
    updateSetting,
    faqSetting,
    getQuestion,
    getQuestionById,
    getSpecificSetting,
    contactSetting,
    getContact,
    getContactById,
    contactEmail,
    faqDelete,
    faqUpdate,
    deleteContact
};
// // Get all settings (single document)
// const getSettings = async () => {
//   const result = await Settings.findOne();
//   return result;
// };
