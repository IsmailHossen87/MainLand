"use strict";
// services/payout.service.ts
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
const processEventPayouts = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const today = new Date();
    // যে events এর 14 দিন পার হয়ে গেছে
    const eventsForPayout = yield Event_model_1.Event.find({
        eventEndDate: { $lte: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000) },
        payoutStatus: 'pending'
    });
    for (const event of eventsForPayout) {
        try {
            // এই event এর সব transactions নিয়ে আসুন
            const transactions = yield transactionHistory_1.TransactionHistory.find({
                eventId: event._id,
                payoutStatus: 'pending'
            });
            // Group by user (organizer/seller)
            const payoutMap = new Map();
            transactions.forEach(txn => {
                var _a;
                const userId = ((_a = txn.organizerId) === null || _a === void 0 ? void 0 : _a.toString()) || txn.userId.toString();
                const currentAmount = payoutMap.get(userId) || 0;
                payoutMap.set(userId, currentAmount + (txn.organizerPayout || 0));
            });
            // প্রত্যেক user কে transfer করুন
            for (const [userId, amount] of payoutMap.entries()) {
                const user = yield user_model_1.User.findById(userId);
                if (!user || !((_a = user === null || user === void 0 ? void 0 : user.stripeAccountInfo) === null || _a === void 0 ? void 0 : _a.stripeAccountId)) {
                    console.error(`User ${userId} has no Stripe account`);
                    continue;
                }
                if (amount <= 0)
                    continue;
                // ✅ Stripe Transfer তৈরি করুন
                const transfer = yield stripe_config_1.default.transfers.create({
                    amount: Math.round(amount * 100), // cents এ convert
                    currency: 'usd',
                    destination: user.stripeAccountInfo.stripeAccountId,
                    description: `Payout for event: ${event.eventName}`,
                    metadata: {
                        eventId: event._id.toString(),
                        userId: user._id.toString()
                    }
                });
                // Update user balance
                yield user_model_1.User.findByIdAndUpdate(userId, {
                    $inc: {
                        pendingBalance: -amount,
                        availableBalance: amount
                    }
                });
                // Update transactions
                yield transactionHistory_1.TransactionHistory.updateMany({
                    eventId: event._id,
                    $or: [
                        { organizerId: userId },
                        { userId: userId }
                    ],
                    payoutStatus: 'pending'
                }, {
                    $set: {
                        payoutStatus: 'completed',
                        payoutDate: new Date(),
                        stripeTransferId: transfer.id
                    }
                });
            }
            // Update event payout status
            yield Event_model_1.Event.findByIdAndUpdate(event._id, {
                payoutStatus: 'completed',
                payoutDate: new Date()
            });
            console.log(`✅ Payouts completed for event: ${event.eventName}`);
        }
        catch (error) {
            console.error(`❌ Payout failed for event ${event._id}:`, error);
            yield Event_model_1.Event.findByIdAndUpdate(event._id, {
                payoutStatus: 'pending' // Retry next time
            });
        }
    }
});
// Cron job setup (using node-cron)
const node_cron_1 = __importDefault(require("node-cron"));
const Event_model_1 = require("../ORGANIZER/Event/Event.model");
const transactionHistory_1 = require("./transactionHistory");
const user_model_1 = require("../user/user.model");
const stripe_config_1 = __importDefault(require("../../config/stripe.config"));
// প্রতিদিন রাত 2 টায় চলবে
node_cron_1.default.schedule('0 2 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    yield processEventPayouts();
}));
exports.payoutService = {
    processEventPayouts
};
