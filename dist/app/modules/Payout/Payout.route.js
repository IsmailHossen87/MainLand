"use strict";
// routes/payout.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const Payout_controller_1 = require("./Payout.controller");
const router = express_1.default.Router();
// ========================================
// 🔐 USER ROUTES (Protected)
// ========================================
router.post('/withdraw', (0, auth_1.default)('user', 'organizer'), Payout_controller_1.payoutController.withdrawBalance);
/**
 * GET /api/v1/payout/my-balance
 * Get current user's balance (pending + available)
 */
router.get('/my-balance', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), Payout_controller_1.payoutController.getMyBalance);
/**
 * GET /api/v1/payout/my-history
 * Get current user's payout history
 */
router.get('/my-history', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), Payout_controller_1.payoutController.getMyPayoutHistory);
/**
 * GET /api/v1/payout/my-pending
 * Get current user's pending payouts
 */
router.get('/my-pending', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ORGANIZER), Payout_controller_1.payoutController.getMyPendingPayouts);
// ========================================
// 🔐 ADMIN ROUTES (Admin only)
// ========================================
/**
 * POST /api/v1/payout/trigger/:eventId
 * Manually trigger payout for an event (Admin)
 */
router.post('/trigger/:eventId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), Payout_controller_1.payoutController.triggerEventPayout);
/**
 * GET /api/v1/payout/event-summary/:eventId
 * Get payout summary for an event (Admin)
 */
router.get('/event-summary/:eventId', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), Payout_controller_1.payoutController.getEventPayoutSummary);
exports.payoutRoutes = router;
