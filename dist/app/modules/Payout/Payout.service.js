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
exports.payoutService = void 0;
const http_status_codes_1 = require("http-status-codes");
const emailHelper_1 = require("../../../helpers/emailHelper");
const stripe_config_1 = __importDefault(require("../../config/stripe.config"));
const Event_model_1 = require("../ORGANIZER/Event/Event.model");
const transactionHistory_1 = require("../Payment/transactionHistory");
const user_model_1 = require("../user/user.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
/**
 * ✅ Main Payout Function
 * Event শেষ হওয়ার 14 দিন পর organizer/seller দের টাকা transfer করবে
 */
const processEventPayouts = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const today = new Date();
    console.log('🔄 Starting payout process...');
    // ✅ যে events এর payout eligible date আজকে বা তার আগে
    const eventsForPayout = yield Event_model_1.Event.find({
        payoutEligibleDate: { $lte: today },
        payoutStatus: 'pending'
    });
    console.log(`📋 Found ${eventsForPayout.length} events ready for payout`);
    for (const event of eventsForPayout) {
        try {
            console.log(`\n💰 Processing payout for event: ${event.eventName} (${event._id})`);
            // Mark as processing
            yield Event_model_1.Event.findByIdAndUpdate(event._id, {
                payoutStatus: 'processing'
            });
            // ✅ এই event এর সব pending transactions নিয়ে আসুন
            const transactions = yield transactionHistory_1.TransactionHistory.find({
                eventId: event._id,
                payoutStatus: 'pending',
                organizerPayout: { $gt: 0 } // শুধু যাদের payout আছে
            });
            console.log(`   📊 Found ${transactions.length} transactions to process`);
            // ✅ Group by user (organizer/seller) - Calculate total payout per user
            const payoutMap = new Map();
            transactions.forEach(txn => {
                var _a;
                // Payout যাবে organizerId এর কাছে (যে ticket এর owner)
                const userId = (_a = txn.organizerId) === null || _a === void 0 ? void 0 : _a.toString();
                if (!userId)
                    return;
                const current = payoutMap.get(userId) || { amount: 0, transactionIds: [] };
                current.amount += txn.organizerPayout || 0;
                current.transactionIds.push(txn._id.toString());
                payoutMap.set(userId, current);
            });
            console.log(`   👥 Processing payouts for ${payoutMap.size} users`);
            // ✅ প্রত্যেক user কে Stripe Transfer করুন
            for (const [userId, payoutData] of payoutMap.entries()) {
                try {
                    const user = yield user_model_1.User.findById(userId);
                    if (!user) {
                        console.error(`   ❌ User ${userId} not found, skipping...`);
                        continue;
                    }
                    // ✅ Check if user has Stripe Connected Account
                    if (!((_a = user.stripeAccountInfo) === null || _a === void 0 ? void 0 : _a.stripeAccountId)) {
                        console.error(`   ❌ User ${user.name} (${userId}) has no Stripe account, skipping...`);
                        // ✅ Mark transactions as failed
                        yield transactionHistory_1.TransactionHistory.updateMany({ _id: { $in: payoutData.transactionIds } }, {
                            payoutStatus: 'failed',
                            payoutFailureReason: 'No Stripe account connected'
                        });
                        continue;
                    }
                    // ✅ Check if Stripe account is active
                    const stripeAccount = yield stripe_config_1.default.accounts.retrieve(user.stripeAccountInfo.stripeAccountId);
                    if (!stripeAccount.charges_enabled || !stripeAccount.payouts_enabled) {
                        console.error(`   ❌ User ${user.name}'s Stripe account is not active, skipping...`);
                        yield transactionHistory_1.TransactionHistory.updateMany({ _id: { $in: payoutData.transactionIds } }, {
                            payoutStatus: 'failed',
                            payoutFailureReason: 'Stripe account not active'
                        });
                        continue;
                    }
                    const amount = payoutData.amount;
                    if (amount <= 0) {
                        console.log(`   ⚠️ User ${user.name} has $0 payout, skipping...`);
                        continue;
                    }
                    console.log(`   💸 Transferring $${amount.toFixed(2)} to ${user.name} (${user.email})`);
                    // ✅✅ CREATE STRIPE TRANSFER
                    const transfer = yield stripe_config_1.default.transfers.create({
                        amount: Math.round(amount * 100), // Convert to cents
                        currency: 'usd',
                        destination: user.stripeAccountInfo.stripeAccountId,
                        description: `Payout for event: ${event.eventName}`,
                        metadata: {
                            eventId: event._id.toString(),
                            userId: user._id.toString(),
                            eventName: event.eventName,
                        }
                    });
                    console.log(`   ✅ Transfer successful! Transfer ID: ${transfer.id}`);
                    // ✅ Update user balance
                    yield user_model_1.User.findByIdAndUpdate(userId, {
                        $inc: {
                            pendingBalance: -amount, // Pending থেকে minus
                            availableBalance: amount, // Available এ plus
                        }
                    });
                    // ✅ Update all transactions for this user & event
                    yield transactionHistory_1.TransactionHistory.updateMany({ _id: { $in: payoutData.transactionIds } }, {
                        $set: {
                            payoutStatus: 'completed',
                            payoutDate: new Date(),
                            stripeTransferId: transfer.id
                        }
                    });
                    // ✅ Send email notification
                    try {
                        yield emailHelper_1.emailHelper.sendEmail({
                            to: user.email,
                            subject: `💰 Payment Received - ${event.eventName}`,
                            html: `
                <h2>Payment Received!</h2>
                <p>Hi ${user.name},</p>
                <p>You've received a payment of <strong>$${amount.toFixed(2)}</strong> for event: <strong>${event.eventName}</strong></p>
                <p>The money has been transferred to your connected Stripe account.</p>
                <p>Thank you for using our platform!</p>
              `
                        });
                        console.log(`   📧 Email sent to ${user.email}`);
                    }
                    catch (emailError) {
                        console.error(`   ⚠️ Failed to send email to ${user.email}:`, emailError);
                    }
                }
                catch (userError) {
                    console.error(`   ❌ Failed to process payout for user ${userId}:`, userError.message);
                    // Mark as failed
                    yield transactionHistory_1.TransactionHistory.updateMany({ _id: { $in: payoutData.transactionIds } }, {
                        payoutStatus: 'failed',
                        payoutFailureReason: userError.message
                    });
                }
            }
            // ✅ Check if all transactions are completed or failed
            const remainingPending = yield transactionHistory_1.TransactionHistory.countDocuments({
                eventId: event._id,
                payoutStatus: 'pending'
            });
            if (remainingPending === 0) {
                // All done!
                yield Event_model_1.Event.findByIdAndUpdate(event._id, {
                    payoutStatus: 'completed',
                    payoutDate: new Date()
                });
                console.log(`   ✅ Event payout fully completed!`);
            }
            else {
                // Some failed, keep as processing
                yield Event_model_1.Event.findByIdAndUpdate(event._id, {
                    payoutStatus: 'processing'
                });
                console.log(`   ⚠️ ${remainingPending} transactions still pending`);
            }
        }
        catch (eventError) {
            console.error(`❌ Payout failed for event ${event._id}:`, eventError.message);
            // Mark as pending to retry next time
            yield Event_model_1.Event.findByIdAndUpdate(event._id, {
                payoutStatus: 'pending'
            });
        }
    }
    console.log('\n✅ Payout process completed!\n');
});
/**
 * ✅ Manual payout for a specific event (Admin use)
 */
const processEventPayoutManually = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield Event_model_1.Event.findById(eventId);
    if (!event) {
        throw new Error('Event not found');
    }
    console.log(`🔄 Manually processing payout for event: ${event.eventName}`);
    // Temporarily set the event as eligible
    yield Event_model_1.Event.findByIdAndUpdate(eventId, {
        payoutEligibleDate: new Date(),
        payoutStatus: 'pending'
    });
    // Process
    yield processEventPayouts();
    console.log(`✅ Manual payout process completed for event: ${event.eventName}`);
});
/**
 * ✅ Get payout summary for an event
 */
const getEventPayoutSummary = (eventId) => __awaiter(void 0, void 0, void 0, function* () {
    const transactions = yield transactionHistory_1.TransactionHistory.find({
        eventId,
        organizerPayout: { $gt: 0 }
    }).populate('organizerId', 'name email');
    const summary = {
        totalPayout: 0,
        pendingPayout: 0,
        completedPayout: 0,
        failedPayout: 0,
        users: []
    };
    const userMap = new Map();
    transactions.forEach(txn => {
        var _a;
        const userId = (_a = txn.organizerId) === null || _a === void 0 ? void 0 : _a._id.toString();
        if (!userId)
            return;
        const amount = txn.organizerPayout || 0;
        summary.totalPayout += amount;
        if (txn.payoutStatus === 'pending') {
            summary.pendingPayout += amount;
        }
        else if (txn.payoutStatus === 'completed') {
            summary.completedPayout += amount;
        }
        else if (txn.payoutStatus === 'failed') {
            summary.failedPayout += amount;
        }
        if (!userMap.has(userId)) {
            userMap.set(userId, {
                userId,
                name: txn.organizerId.name,
                email: txn.organizerId.email,
                totalPayout: 0,
                status: txn.payoutStatus
            });
        }
        userMap.get(userId).totalPayout += amount;
    });
    summary.users = Array.from(userMap.values());
    return summary;
});
// ✅ Payout money 
const withdrawBalance = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // Check if user has Stripe account
    if (!((_a = user.stripeAccountInfo) === null || _a === void 0 ? void 0 : _a.stripeAccountId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please connect your Stripe account first to withdraw');
    }
    // Get all eligible transactions (14 days after event, still pending)
    const today = new Date();
    const eligibleTransactions = yield transactionHistory_1.TransactionHistory.find({
        $or: [{ organizerId: userId }, { userId: userId }],
        payoutStatus: 'pending',
        payoutEligibleDate: { $lte: today }
    });
    if (eligibleTransactions.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No eligible balance available for withdrawal. Please wait 14 days after event ends.');
    }
    // Calculate total eligible amount
    const totalAmount = eligibleTransactions.reduce((sum, txn) => sum + (txn.organizerPayout || 0), 0);
    if (totalAmount <= 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Withdrawal amount must be greater than zero');
    }
    try {
        // ✅ Create Stripe Transfer - Direct to user's Stripe account
        const transfer = yield stripe_config_1.default.transfers.create({
            amount: Math.round(totalAmount * 100),
            currency: 'usd',
            destination: user.stripeAccountInfo.stripeAccountId,
            description: `Withdrawal - User: ${user.name}`,
            metadata: {
                userId: user._id.toString(),
                transactionIds: eligibleTransactions.map(t => t._id.toString()).join(',')
            }
        });
        // ✅ Update user balance
        yield user_model_1.User.findByIdAndUpdate(userId, {
            $inc: {
                pendingBalance: -totalAmount,
                availableBalance: totalAmount
            }
        });
        // ✅ Update all eligible transactions to completed
        yield transactionHistory_1.TransactionHistory.updateMany({
            _id: { $in: eligibleTransactions.map(t => t._id) }
        }, {
            $set: {
                payoutStatus: 'completed',
                payoutDate: new Date(),
                stripeTransferId: transfer.id
            }
        });
        return {
            success: true,
            amount: totalAmount,
            transferId: transfer.id,
            transactionsProcessed: eligibleTransactions.length
        };
    }
    catch (error) {
        console.error('❌ Stripe transfer failed:', error);
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Withdrawal failed: ${error.message}`);
    }
});
exports.payoutService = {
    processEventPayouts,
    processEventPayoutManually,
    getEventPayoutSummary,
    withdrawBalance
};
