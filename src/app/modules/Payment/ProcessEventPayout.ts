// services/payout.service.ts


const processEventPayouts = async () => {
  const today = new Date();

  // যে events এর 14 দিন পার হয়ে গেছে
  const eventsForPayout = await Event.find({
    eventEndDate: { $lte: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000) },
    payoutStatus: 'pending'
  });

  for (const event of eventsForPayout) {
    try {
      // এই event এর সব transactions নিয়ে আসুন
      const transactions = await TransactionHistory.find({
        eventId: event._id,
        payoutStatus: 'pending'
      });

      // Group by user (organizer/seller)
      const payoutMap = new Map<string, number>();

      transactions.forEach(txn => {
        const userId = txn.organizerId?.toString() || txn.userId.toString();
        const currentAmount = payoutMap.get(userId) || 0;
        payoutMap.set(userId, currentAmount + (txn.organizerPayout || 0));
      });

      // প্রত্যেক user কে transfer করুন
      for (const [userId, amount] of payoutMap.entries()) {
        const user = await User.findById(userId);

        if (!user || !user?.stripeAccountInfo?.stripeAccountId) {
          console.error(`User ${userId} has no Stripe account`);
          continue;
        }

        if (amount <= 0) continue;

        // ✅ Stripe Transfer তৈরি করুন
        const transfer = await stripe.transfers.create({
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
        await User.findByIdAndUpdate(userId, {
          $inc: {
            pendingBalance: -amount,
            availableBalance: amount
          }
        });

        // Update transactions
        await TransactionHistory.updateMany(
          {
            eventId: event._id,
            $or: [
              { organizerId: userId },
              { userId: userId }
            ],
            payoutStatus: 'pending'
          },
          {
            $set: {
              payoutStatus: 'completed',
              payoutDate: new Date(),
              stripeTransferId: transfer.id
            }
          }
        );
      }

      // Update event payout status
      await Event.findByIdAndUpdate(event._id, {
        payoutStatus: 'completed',
        payoutDate: new Date()
      });

      console.log(`✅ Payouts completed for event: ${event.eventName}`);
    } catch (error) {
      console.error(`❌ Payout failed for event ${event._id}:`, error);
      await Event.findByIdAndUpdate(event._id, {
        payoutStatus: 'pending' // Retry next time
      });
    }
  }
};

// Cron job setup (using node-cron)
import cron from 'node-cron';
import { Event } from '../ORGANIZER/Event/Event.model';
import { TransactionHistory } from './transactionHistory';
import { User } from '../user/user.model';
import stripe from '../../config/stripe.config';

// প্রতিদিন রাত 2 টায় চলবে
cron.schedule('0 2 * * *', async () => {
  await processEventPayouts();
});

export const payoutService = {
  processEventPayouts
};