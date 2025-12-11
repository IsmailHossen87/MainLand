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
exports.SettingController = void 0;
const http_status_codes_1 = require("http-status-codes");
const Setting_Service_1 = require("./Setting.Service");
// Create or update
const updateSetting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, title, content } = req.body;
        if (!type) {
            throw new Error("Setting type is required");
        }
        const result = yield Setting_Service_1.SettingService.updateSetting({ type, title, content });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: `${type} updated successfully`,
            data: result,
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
});
const faqCreate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, question, answer, faqType } = req.body;
        if (!type) {
            throw new Error("Setting type is required");
        }
        const userId = req.user;
        const result = yield Setting_Service_1.SettingService.faqSetting(userId, { type, question, answer, faqType });
        // check
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            message: `${question} created successfully`,
            data: result,
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
});
// const getSetting = async (req: Request, res: Response) => {
//   try { 
//     const { type } = req.query;
//     const result = await SettingService.getSettings();
//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Settings fetched successfully",
//       data: result
//     });
//   } catch (error: any) {
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
const getQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user;
        const faqType = req.params.faqType;
        const query = req.query;
        const result = yield Setting_Service_1.SettingService.getQuestion(userId, faqType, query);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Settings fetched successfully",
            meta: result.meta,
            data: result.data
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
});
const getQuestionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield Setting_Service_1.SettingService.getQuestionById(req.params.id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Faq fetched successfully",
            data: result
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
});
const getSpecificSetting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const key = req.params.key; // "about_us"
        const result = yield Setting_Service_1.SettingService.getSpecificSetting(key);
        if (!result) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: `Setting '${key}' not found`
            });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Setting fetched successfully",
            data: result
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
});
// CONTACT
const contactCreate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield Setting_Service_1.SettingService.contactSetting(userId, req.body);
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        success: true,
        message: "Contact created successfully",
        data: result,
    });
});
const getContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.query;
        const result = yield Setting_Service_1.SettingService.getContact(query);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Contact fetched successfully",
            meta: result.meta,
            data: result.data
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
});
const getContactById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield Setting_Service_1.SettingService.getContactById(req.params.id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Contact fetched successfully",
            data: result
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
});
const contactEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { adminMessage } = req.body;
        if (!adminMessage) {
            throw new Error("Admin message is required");
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const result = yield Setting_Service_1.SettingService.contactEmail(req.params.id, adminMessage, userId);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Contact email message successfully",
            data: result
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
});
const faqDelete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield Setting_Service_1.SettingService.faqDelete(req.params.id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Faq deleted successfully",
            data: result
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
});
const faqUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield Setting_Service_1.SettingService.faqUpdate(req.params.id, req.body);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Faq updated successfully",
            data: result
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
});
const deleteContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield Setting_Service_1.SettingService.deleteContact(req.params.id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Contact deleted successfully",
            data: result
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
});
exports.SettingController = {
    updateSetting,
    faqCreate,
    getQuestion,
    getQuestionById,
    getSpecificSetting,
    contactCreate,
    getContact,
    getContactById,
    contactEmail,
    faqDelete,
    faqUpdate,
    deleteContact,
};
