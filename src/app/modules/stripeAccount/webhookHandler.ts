import { Request, Response } from 'express';
import Stripe from 'stripe';
import config from '../../../config';
import stripe from '../../config/stripe.config';
import { logger } from '../../../shared/logger';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { handlePayment } from '../../handlears/handlePaymentSuccess';
import { User } from '../user/user.model';


const webhookHandler = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = config.stripe.stripe_webhook_secret;

  if (!webhookSecret) {
    res.status(500).send('Stripe webhook secret not configured');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      webhookSecret
    );
  } catch (err: any) {
    logger.error('Webhook signature verification failed', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      // ======================================
      // ✅ CHECKOUT PAYMENT COMPLETED
      // ======================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        // 🔑 Get PaymentIntent
        const paymentIntentId = session.payment_intent;

        if (!paymentIntentId) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'PaymentIntent not found in checkout session'
          );
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId as string
        );

        // ✅ Ensure payment success
        if (paymentIntent.status !== 'succeeded') {
          logger.warn(
            `Payment not successful. Status: ${paymentIntent.status}`
          );
          break;
        }

        console.log("session", session)

        console.log("metadata", metadata)


        // 🔁 Route by payment type
        if (metadata.type === 'resellPurchase') {
          await handlePayment.repurchaseTicket(
            session,
            paymentIntent
          );
        } else if (metadata.eventId && metadata.userId) {
          await handlePayment.handleEvent(
            session,
            paymentIntent
          );
        } else {
          logger.warn('Unknown payment type received in webhook metadata');
        }

        break;
      }

      // ======================================
      // 💸 STRIPE TRANSFER CREATED
      // ======================================
      case 'transfer.created':
        logger.info('Transfer created', event.data.object);
        break;

      // ======================================
      // 🏦 CONNECTED ACCOUNT UPDATED
      // ======================================
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;

        if (!account.email) break;

        const loginLink = await stripe.accounts.createLoginLink(account.id);

        await User.updateOne(
          { email: account.email },
          {
            $set: {
              'stripeAccountInfo.loginUrl': loginLink.url,
            },
          }
        );

        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
        break;
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error('Webhook processing error', err);
    res.status(500).send(`Webhook Error: ${err.message}`);
  }
};

export default webhookHandler;
