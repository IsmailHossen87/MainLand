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
exports.stripeAccountController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const stripe_config_1 = __importDefault(require("../../config/stripe.config"));
const stripeAccount_service_1 = require("./stripeAccount.service");
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../user/user.model");
const createStripeAccount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stripeAccount_service_1.stripeAccountService.createConnectedStripeAccount(req.user, req.get('host') || '', req.protocol);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Stripe account created',
        data: result,
    });
}));
const successPageAccount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { id } = req.params;
    const account = yield stripe_config_1.default.accounts.update(id, {});
    // console.log('account', account);
    if (((_a = account === null || account === void 0 ? void 0 : account.requirements) === null || _a === void 0 ? void 0 : _a.disabled_reason) && ((_b = account === null || account === void 0 ? void 0 : account.requirements) === null || _b === void 0 ? void 0 : _b.disabled_reason.indexOf('rejected')) > -1) {
        return res.redirect(`${req.protocol + '://' + req.get('host')}/api/v1/stripe/refreshAccountConnect/${id}`);
    }
    if (((_c = account === null || account === void 0 ? void 0 : account.requirements) === null || _c === void 0 ? void 0 : _c.disabled_reason) && ((_d = account === null || account === void 0 ? void 0 : account.requirements) === null || _d === void 0 ? void 0 : _d.currently_due) && ((_f = (_e = account === null || account === void 0 ? void 0 : account.requirements) === null || _e === void 0 ? void 0 : _e.currently_due) === null || _f === void 0 ? void 0 : _f.length) > 0) {
        return res.redirect(`${req.protocol + '://' + req.get('host')}/api/v1/stripe/refreshAccountConnect/${id}`);
    }
    if (!account.payouts_enabled) {
        return res.redirect(`${req.protocol + '://' + req.get('host')}/api/v1/stripe/refreshAccountConnect/${id}`);
    }
    if (!account.charges_enabled) {
        return res.redirect(`${req.protocol + '://' + req.get('host')}/api/v1/stripe/refreshAccountConnect/${id}`);
    }
    if (((_g = account === null || account === void 0 ? void 0 : account.requirements) === null || _g === void 0 ? void 0 : _g.pending_verification) && ((_j = (_h = account === null || account === void 0 ? void 0 : account.requirements) === null || _h === void 0 ? void 0 : _h.pending_verification) === null || _j === void 0 ? void 0 : _j.length) > 0) {
        return res.redirect(`${req.protocol + '://' + req.get('host')}/api/v1/stripe/refreshAccountConnect/${id}`);
    }
    yield user_model_1.User.updateOne({ "stripeAccountInfo.stripeAccountId": id }, { isCompleted: true });
    res.render('success-account.ejs');
}));
const refreshAccountConnect = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const url = yield stripeAccount_service_1.stripeAccountService.refreshAccountConnect(id, req.get('host') || '', req.protocol);
    res.redirect(url);
}));
const onConnectedStripeAccountSuccess = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stripeAccount_service_1.stripeAccountService.onConnectedStripeAccountSuccess(req.params.accountId);
    res.send(result);
}));
const stripeLoginLink = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield stripeAccount_service_1.stripeAccountService.stripeLoginLink(req.user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Successfully get stripe login link',
        data: result,
    });
}));
exports.stripeAccountController = {
    createStripeAccount,
    successPageAccount,
    refreshAccountConnect,
    onConnectedStripeAccountSuccess,
    stripeLoginLink,
};
