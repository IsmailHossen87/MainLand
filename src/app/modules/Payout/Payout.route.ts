// routes/payout.routes.ts

import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { payoutController } from './Payout.controller';


const router = express.Router();

// ========================================
// 🔐 USER ROUTES (Protected)
// ========================================
router.post(
    '/withdraw',
    auth('user', 'organizer'),
    payoutController.withdrawBalance
);
/**
 * GET /api/v1/payout/my-balance
 * Get current user's balance (pending + available)
 */
router.get(
    '/my-balance',
    auth(USER_ROLES.USER, USER_ROLES.ORGANIZER),
    payoutController.getMyBalance
);

/**
 * GET /api/v1/payout/my-history
 * Get current user's payout history
 */
router.get(
    '/my-history',
    auth(USER_ROLES.USER, USER_ROLES.ORGANIZER),
    payoutController.getMyPayoutHistory
);

/**
 * GET /api/v1/payout/my-pending
 * Get current user's pending payouts
 */
router.get(
    '/my-pending',
    auth(USER_ROLES.USER, USER_ROLES.ORGANIZER),
    payoutController.getMyPendingPayouts
);

// ========================================
// 🔐 ADMIN ROUTES (Admin only)
// ========================================

/**
 * POST /api/v1/payout/trigger/:eventId
 * Manually trigger payout for an event (Admin)
 */
router.post(
    '/trigger/:eventId',
    auth(USER_ROLES.ADMIN),
    payoutController.triggerEventPayout
);

/**
 * GET /api/v1/payout/event-summary/:eventId
 * Get payout summary for an event (Admin)
 */
router.get(
    '/event-summary/:eventId',
    auth(USER_ROLES.ADMIN),
    payoutController.getEventPayoutSummary
);

export const payoutRoutes = router;