// controllers/payout.controller.ts

import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { payoutService } from './Payout.service';
import { StatusCodes } from 'http-status-codes';
import { User } from '../user/user.model';
import AppError from '../../../errors/AppError';
import { TransactionHistory } from '../Payment/transactionHistory';


/**
 * ✅ Admin: Manually trigger payout for an event
 */
const triggerEventPayout = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;

    await payoutService.processEventPayoutManually(eventId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout processed successfully',
    });
});

/**
 * ✅ Payout money
 */
const withdrawBalance = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id; // From auth middleware

    const result = await payoutService.withdrawBalance(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Withdrawal successful! Money transferred to your Stripe account.',
        data: result
    });
});

/**
 * ✅ Admin: Get payout summary for an event
 */
const getEventPayoutSummary = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;

    const summary = await payoutService.getEventPayoutSummary(eventId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout summary retrieved successfully',
        data: summary,
    });
});

/**
 * ✅ User: Get my balance (pending + available)
 */
const getMyBalance = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id;

    const user = await User.findById(userId).select('pendingBalance availableBalance totalEarnings');

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Balance retrieved successfully',
        data: {
            pendingBalance: user?.stripeAccountInfo?.pendingBalance || 0,
            availableBalance: user?.stripeAccountInfo?.availableBalance || 0,
            totalEarnings: user?.totalEarnings || 0,
        },
    });
});

/**
 * ✅ User: Get my payout history
 */
const getMyPayoutHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id;

    const transactions = await TransactionHistory.find({
        organizerId: userId,
        organizerPayout: { $gt: 0 }
    })
        .populate('eventId', 'eventName eventDate')
        .sort({ createdAt: -1 });

    const history = transactions.map(txn => ({
        transactionId: txn._id,
        eventName: (txn.eventId as any)?.eventName,
        eventDate: (txn.eventId as any)?.eventDate,
        amount: txn.organizerPayout,
        status: txn.payoutStatus,
        payoutDate: txn.payoutDate,
        stripeTransferId: txn.stripeTransferId,
        createdAt: txn.createdAt
    }));

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout history retrieved successfully',
        data: history,
    });
});

/**
 * ✅ User: Get pending payouts (যে টাকা আসবে)
 */
const getMyPendingPayouts = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id;

    const pendingTransactions = await TransactionHistory.find({
        organizerId: userId,
        payoutStatus: 'pending',
        organizerPayout: { $gt: 0 }
    })
        .populate('eventId', 'eventName eventDate payoutEligibleDate')
        .sort({ payoutEligibleDate: 1 });

    const pending = pendingTransactions.map(txn => ({
        transactionId: txn._id,
        eventName: (txn.eventId as any)?.eventName,
        eventDate: (txn.eventId as any)?.eventDate,
        amount: txn.organizerPayout,
        payoutEligibleDate: txn.payoutEligibleDate || (txn.eventId as any)?.payoutEligibleDate,
        daysRemaining: txn.payoutEligibleDate
            ? Math.ceil((new Date(txn.payoutEligibleDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null
    }));

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Pending payouts retrieved successfully',
        data: pending,
    });
});

export const payoutController = {
    triggerEventPayout,
    getEventPayoutSummary,
    getMyBalance,
    getMyPayoutHistory,
    getMyPendingPayouts,
    withdrawBalance
};