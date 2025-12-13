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
exports.ActionController = void 0;
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const ActionService_1 = require("./ActionService");
const statusChange = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const eventId = req.params.id;
    const result = yield ActionService_1.ActionService.statusChange(userId, eventId);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Status Update Sucessfully",
        data: result,
    });
}));
const DashBoard = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const query = req.query;
    const result = yield ActionService_1.ActionService.DashBoard(user, query);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "DashBoard retrived Sucessfully",
        data: result,
    });
}));
const blockUser = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
    const adminInfo = req.user;
    const result = yield ActionService_1.ActionService.blockUser(userId, adminInfo);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: result.message,
        data: result.user,
    });
}));
// // All User
const AllTicketBuyerUser = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const query = req.query;
    const result = yield ActionService_1.ActionService.AllTicketBuyerUser(user, query);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "All User Retrived Sucessfully",
        meta: result.meta,
        data: result.data,
    });
}));
// ticket Activity
const ticketActivity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    const userId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
    const query = req.query;
    const result = yield ActionService_1.ActionService.ticketActivity(user, userId, query);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Ticket Activity Retrived Sucessfully",
        data: {
            meta: result.meta,
            data: result.data,
        },
    });
}));
const accountDeleteHistory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield ActionService_1.ActionService.accountDeleteHistory(user);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Account Delete History Retrived Sucessfully",
        data: result,
    });
}));
const allNotification = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const query = req.query;
    const result = yield ActionService_1.ActionService.allNotification(user, query);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "All Notification Retrived Sucessfully",
        meta: result.meta,
        data: result.data,
    });
}));
const ticketHistory = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const query = req.query;
    const id = req === null || req === void 0 ? void 0 : req.params.id;
    const result = yield ActionService_1.ActionService.ticketHistory(user, query, id);
    yield (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Ticket History Retrived Sucessfully",
        data: result,
    });
}));
// const allResellTicket = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const user = req.user
//     const query = req.query
//     const result = await ActionService.allResellTicket(user as JwtPayload, query as Record<string, string>)
//     await sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.OK,
//       message: "All Resell Ticket Retrived Sucessfully",
//       data: result,
//     });
//   }
// );
exports.ActionController = {
    statusChange,
    DashBoard, blockUser, AllTicketBuyerUser, ticketActivity, accountDeleteHistory, allNotification, ticketHistory
};
