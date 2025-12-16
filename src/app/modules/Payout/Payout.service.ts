import { emailHelper } from "../../../helpers/emailHelper";
import stripe from "../../config/stripe.config";
import { Event } from "../ORGANIZER/Event/Event.model";
import { TransactionHistory } from "../Payment/transactionHistory";
import { User } from "../user/user.model";


/**
 * ✅ Main Payout Function
 * Event শেষ হওয়ার 14 দিন পর organizer/seller দের টাকা transfer করবে
 */
const processEventPayouts = async () => {
    const today = new Date();

    console.log('🔄 Starting payout process...');

    // ✅ যে events এর payout eligible date আজকে বা তার আগে
    const eventsForPayout = await Event.find({
        payoutEligibleDate: { $lte: today },
        payoutStatus: 'pending'
    });

    console.log(`📋 Found ${eventsForPayout.length} events ready for payout`);

    for (const event of eventsForPayout) {
        try {
            console.log(`\n💰 Processing payout for event: ${event.eventName} (${event._id})`);

            // Mark as processing
            await Event.findByIdAndUpdate(event._id, {
                payoutStatus: 'processing'
            });

            // ✅ এই event এর সব pending transactions নিয়ে আসুন
            const transactions = await TransactionHistory.find({
                eventId: event._id,
                payoutStatus: 'pending',
                organizerPayout: { $gt: 0 } // শুধু যাদের payout আছে
            });

            console.log(`   📊 Found ${transactions.length} transactions to process`);

            // ✅ Group by user (organizer/seller) - Calculate total payout per user
            const payoutMap = new Map<string, { amount: number; transactionIds: string[] }>();

            transactions.forEach(txn => {
                // Payout যাবে organizerId এর কাছে (যে ticket এর owner)
                const userId = txn.organizerId?.toString();

                if (!userId) return;

                const current = payoutMap.get(userId) || { amount: 0, transactionIds: [] };
                current.amount += txn.organizerPayout || 0;
                current.transactionIds.push(txn._id.toString());
                payoutMap.set(userId, current);
            });

            console.log(`   👥 Processing payouts for ${payoutMap.size} users`);

            // ✅ প্রত্যেক user কে Stripe Transfer করুন
            for (const [userId, payoutData] of payoutMap.entries()) {
                try {
                    const user = await User.findById(userId);

                    if (!user) {
                        console.error(`   ❌ User ${userId} not found, skipping...`);
                        continue;
                    }

                    // ✅ Check if user has Stripe Connected Account
                    if (!user.stripeAccountInfo?.stripeAccountId) {
                        console.error(`   ❌ User ${user.name} (${userId}) has no Stripe account, skipping...`);

                        // ✅ Mark transactions as failed
                        await TransactionHistory.updateMany(
                            { _id: { $in: payoutData.transactionIds } },
                            {
                                payoutStatus: 'failed',
                                payoutFailureReason: 'No Stripe account connected'
                            }
                        );
                        continue;
                    }

                    // ✅ Check if Stripe account is active
                    const stripeAccount = await stripe.accounts.retrieve(
                        user.stripeAccountInfo.stripeAccountId
                    );

                    if (!stripeAccount.charges_enabled || !stripeAccount.payouts_enabled) {
                        console.error(`   ❌ User ${user.name}'s Stripe account is not active, skipping...`);

                        await TransactionHistory.updateMany(
                            { _id: { $in: payoutData.transactionIds } },
                            {
                                payoutStatus: 'failed',
                                payoutFailureReason: 'Stripe account not active'
                            }
                        );
                        continue;
                    }

                    const amount = payoutData.amount;

                    if (amount <= 0) {
                        console.log(`   ⚠️ User ${user.name} has $0 payout, skipping...`);
                        continue;
                    }

                    console.log(`   💸 Transferring $${amount.toFixed(2)} to ${user.name} (${user.email})`);

                    // ✅✅ CREATE STRIPE TRANSFER
                    const transfer = await stripe.transfers.create({
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
                    await User.findByIdAndUpdate(userId, {
                        $inc: {
                            pendingBalance: -amount, // Pending থেকে minus
                            availableBalance: amount, // Available এ plus
                        }
                    });

                    // ✅ Update all transactions for this user & event
                    await TransactionHistory.updateMany(
                        { _id: { $in: payoutData.transactionIds } },
                        {
                            $set: {
                                payoutStatus: 'completed',
                                payoutDate: new Date(),
                                stripeTransferId: transfer.id
                            }
                        }
                    );

                    // ✅ Send email notification
                    try {
                        await emailHelper.sendEmail({
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
                    } catch (emailError) {
                        console.error(`   ⚠️ Failed to send email to ${user.email}:`, emailError);
                    }

                } catch (userError: any) {
                    console.error(`   ❌ Failed to process payout for user ${userId}:`, userError.message);

                    // Mark as failed
                    await TransactionHistory.updateMany(
                        { _id: { $in: payoutData.transactionIds } },
                        {
                            payoutStatus: 'failed',
                            payoutFailureReason: userError.message
                        }
                    );
                }
            }

            // ✅ Check if all transactions are completed or failed
            const remainingPending = await TransactionHistory.countDocuments({
                eventId: event._id,
                payoutStatus: 'pending'
            });

            if (remainingPending === 0) {
                // All done!
                await Event.findByIdAndUpdate(event._id, {
                    payoutStatus: 'completed',
                    payoutDate: new Date()
                });
                console.log(`   ✅ Event payout fully completed!`);
            } else {
                // Some failed, keep as processing
                await Event.findByIdAndUpdate(event._id, {
                    payoutStatus: 'processing'
                });
                console.log(`   ⚠️ ${remainingPending} transactions still pending`);
            }

        } catch (eventError: any) {
            console.error(`❌ Payout failed for event ${event._id}:`, eventError.message);

            // Mark as pending to retry next time
            await Event.findByIdAndUpdate(event._id, {
                payoutStatus: 'pending'
            });
        }
    }

    console.log('\n✅ Payout process completed!\n');
};

/**
 * ✅ Manual payout for a specific event (Admin use)
 */
const processEventPayoutManually = async (eventId: string) => {
    const event = await Event.findById(eventId);

    if (!event) {
        throw new Error('Event not found');
    }

    console.log(`🔄 Manually processing payout for event: ${event.eventName}`);

    // Temporarily set the event as eligible
    await Event.findByIdAndUpdate(eventId, {
        payoutEligibleDate: new Date(),
        payoutStatus: 'pending'
    });

    // Process
    await processEventPayouts();

    console.log(`✅ Manual payout process completed for event: ${event.eventName}`);
};

/**
 * ✅ Get payout summary for an event
 */
const getEventPayoutSummary = async (eventId: string) => {
    const transactions = await TransactionHistory.find({
        eventId,
        organizerPayout: { $gt: 0 }
    }).populate('organizerId', 'name email');

    const summary = {
        totalPayout: 0,
        pendingPayout: 0,
        completedPayout: 0,
        failedPayout: 0,
        users: [] as any[]
    };

    const userMap = new Map<string, any>();

    transactions.forEach(txn => {
        const userId = txn.organizerId?._id.toString();
        if (!userId) return;

        const amount = txn.organizerPayout || 0;
        summary.totalPayout += amount;

        if (txn.payoutStatus === 'pending') {
            summary.pendingPayout += amount;
        } else if (txn.payoutStatus === 'completed') {
            summary.completedPayout += amount;
        } else if (txn.payoutStatus === 'failed') {
            summary.failedPayout += amount;
        }

        if (!userMap.has(userId)) {
            userMap.set(userId, {
                userId,
                name: (txn.organizerId as any).name,
                email: (txn.organizerId as any).email,
                totalPayout: 0,
                status: txn.payoutStatus
            });
        }

        userMap.get(userId).totalPayout += amount;
    });

    summary.users = Array.from(userMap.values());

    return summary;
};

export const payoutService = {
    processEventPayouts,
    processEventPayoutManually,
    getEventPayoutSummary
};