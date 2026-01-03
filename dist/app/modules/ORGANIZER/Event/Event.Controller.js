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
exports.EventController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const Event_Service_1 = require("./Event.Service");
const ApiError_1 = __importDefault(require("../../../../errors/ApiError"));
const user_model_1 = require("../../user/user.model");
const stripe_config_1 = __importDefault(require("../../../config/stripe.config"));
// SubCategory
const createSubCategory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    req.body.userId = userId;
    const result = yield Event_Service_1.EventService.creteSubCategory(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Sub-Category created successfully',
        data: result,
    });
}));
const createCategory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    req.body.userId = userId;
    if (req.body.data) {
        const data = JSON.parse(req.body.data);
        req.body = Object.assign(Object.assign({}, data), { userId });
    }
    if (req.files && 'image' in req.files && req.files.image[0]) {
        req.body.coverImage = `/image/${req.files.image[0].filename}`;
    }
    const result = yield Event_Service_1.EventService.creteCategory(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Category created successfully',
        data: result,
    });
}));
// UPDATEcategory
const updateCategory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryId = req.params.id;
    // Handle image if uploaded
    if (req.files && "image" in req.files && req.files.image[0]) {
        req.body.coverImage = `/image/${req.files.image[0].filename}`;
    }
    const updatedCategory = yield Event_Service_1.EventService.updateCategory(categoryId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Category updated successfully",
        data: updatedCategory,
    });
}));
// UPDATEcategory
const updateSubCategory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const SubcategoryId = req.params.id;
    const updatedCategory = yield Event_Service_1.EventService.updateSubCategory(SubcategoryId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "SubCategory updated successfully",
        data: updatedCategory,
    });
}));
// Delete Category
const deleteCategory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const type = req.query.type;
    const deletedCategory = yield Event_Service_1.EventService.deleteCategory(id, type);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `${type} deleted successfully`,
        data: deletedCategory,
    });
}));
// // 1️⃣ Create Event (Draft or Full)
// const createEvent = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const userId = (req.user as IJwtUser)?.id;
//     if (req.files && 'image' in req.files && req.files.image[0]) {
//       req.body.image = `/image/${req.files.image[0].filename}`;
//     }
//     const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new ApiError(
//         StatusCodes.NOT_FOUND,
//         'User not found'
//       );
//     }
//     if (req.body.isDraft === 'true') {
//       if (!user.stripeAccountInfo?.stripeAccountId) {
//         throw new ApiError(
//           StatusCodes.BAD_REQUEST,
//           'You must connect your Stripe account before creating paid events. Please connect your account from Settings.'
//         );
//       }
//       // Verify Stripe account is active
//       try {
//         const account = await stripe.accounts.retrieve(
//           user.stripeAccountInfo.stripeAccountId
//         );
//         if (!account.charges_enabled || !account.payouts_enabled) {
//           throw new ApiError(
//             StatusCodes.BAD_REQUEST,
//             'Your Stripe account is not fully activated. Please complete the onboarding process.'
//           );
//         }
//       } catch (error) {
//         throw new ApiError(
//           StatusCodes.BAD_REQUEST,
//           'Invalid Stripe account. Please reconnect your account.'
//         );
//       }
//     }
//     const event = await EventService.createEvent({
//       ...req.body,
//       userId,
//       isDraft,
//     });
//     await sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.CREATED,
//       message: isDraft
//         ? 'Draft saved successfully'
//         : 'Event created successfully',
//       data: event,
//     });
//   }
// );
const createEvent = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    // Image upload handle করা
    if (req.files && 'image' in req.files && req.files.image[0]) {
        req.body.image = `/image/${req.files.image[0].filename}`;
    }
    const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';
    // User check করা
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // ✅ FIX: isFreeEvent check - string এবং boolean দুটোই handle করা
    const isFreeEvent = req.body.isFreeEvent === true || req.body.isFreeEvent === 'true';
    // ✅ FIX: Stripe check শুধুমাত্র published paid event এর জন্য
    // Logic: isDraft === 'false' (published) এবং isFreeEvent === false (paid)
    if (req.body.isDraft === 'false' && !isFreeEvent) {
        // Check if Stripe account exists
        if (!((_b = user.stripeAccountInfo) === null || _b === void 0 ? void 0 : _b.stripeAccountId)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You must connect your Stripe account before creating paid events. Please connect your account from Settings.');
        }
        // Verify Stripe account is active and ready for payments
        try {
            const account = yield stripe_config_1.default.accounts.retrieve(user.stripeAccountInfo.stripeAccountId);
            if (!account.charges_enabled || !account.payouts_enabled) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Your Stripe account is not fully activated. Please complete the onboarding process.');
            }
        }
        catch (error) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Stripe account. Please reconnect your account.');
        }
    }
    // Event create/update করা
    const event = yield Event_Service_1.EventService.createEvent(Object.assign(Object.assign({}, req.body), { userId,
        isDraft }));
    // Success response
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: isDraft
            ? 'Draft saved successfully'
            : 'Event created successfully',
        data: event,
    });
}));
// 2️⃣ Update Event (Draft update or Publish)
const updateEvent = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = req.params.id;
    if (req.files && 'image' in req.files && req.files.image[0]) {
        req.body.image = `/image/${req.files.image[0].filename}`;
    }
    const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';
    const updatedEvent = yield Event_Service_1.EventService.updateEvent(eventId, userId, Object.assign(Object.assign({}, req.body), { isDraft }));
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: isDraft
            ? 'Draft updated successfully'
            : 'Event published successfully',
        data: updatedEvent,
    });
}));
// 2️⃣ UpdateNotification
const updateNotification = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = req.params.id;
    const notification = req.body.notification;
    console.log(eventId, userId, notification);
    const updatedEvent = yield Event_Service_1.EventService.updateNotification(eventId, userId, notification);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Notification updated successfully',
        data: updatedEvent,
    });
}));
const singleEvent = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = req.params.id;
    const result = yield Event_Service_1.EventService.singleEvent(userId, eventId);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Event details Successfully",
        data: result,
    });
}));
const allLiveEvent = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const result = yield Event_Service_1.EventService.allLiveEvent(query);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "My event Retrived Successfully",
        meta: result.meta,
        data: result.data,
    });
}));
const popularEvent = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const result = yield Event_Service_1.EventService.popularEvent(query);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "My event Retrived Successfully",
        meta: result.meta,
        data: result.data,
    });
}));
// All Data Use Query
const allDataUseQuery = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const query = req.query;
    const result = yield Event_Service_1.EventService.allDataUseQuery(userId, query);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Event All Data Retrived Successfully",
        meta: result.meta,
        data: result.data,
    });
}));
// All Data Use Query
const AllUnderReview = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const query = req.query;
    console.log(query);
    const result = yield Event_Service_1.EventService.allUndewReview(userId, query);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Event All Undew-Review Retrived Successfully",
        meta: result.meta,
        data: result.data,
    });
}));
// Closed Event ✅✅✅✅
const closedEvent = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const query = req.query;
    const result = yield Event_Service_1.EventService.closedEvent(userId, query);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Event All Closed Retrived Successfully",
        meta: result.meta,
        data: result.data,
    });
}));
// All Data Use Query
const subCategory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryID = req.query.categoryId;
    const result = yield Event_Service_1.EventService.subCategory(categoryID);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Category All Data Retrived Successfully",
        data: result,
    });
}));
// All Data Use Query
const allCategory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const query = req.query;
    const result = yield Event_Service_1.EventService.allCategory(userId, query);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Category All Data Retrived Successfully",
        data: result,
    });
}));
// All Event History
const eventTicketHistory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield Event_Service_1.EventService.eventTicketHistory(req.params.id);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Event History Retrived Successfully",
        data: result,
    });
}));
// Bar Code Check
const barCodeCheck = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = req.params.id;
    const query = req.query;
    const result = yield Event_Service_1.EventService.barCodeCheck(query.ownerId, userId, eventId, query.isUpdate);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Bar Code Check Successfully",
        data: result,
    });
}));
const perticipentCount = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield Event_Service_1.EventService.perticipentCount(req.params.eventCode);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Event Perticipent Count Retrived Successfully",
        data: result,
    });
}));
exports.EventController = {
    createSubCategory,
    createCategory,
    createEvent,
    updateEvent,
    updateNotification,
    updateSubCategory,
    allLiveEvent,
    popularEvent,
    singleEvent,
    allDataUseQuery,
    closedEvent,
    updateCategory,
    deleteCategory,
    subCategory,
    allCategory,
    eventTicketHistory,
    AllUnderReview,
    barCodeCheck,
    perticipentCount
};
