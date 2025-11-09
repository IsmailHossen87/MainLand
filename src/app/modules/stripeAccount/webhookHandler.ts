import { Request, Response } from 'express';
import Stripe from 'stripe';
import config from '../../../config';
import stripe from '../../config/stripe.config';
import { logger } from '../../../shared/logger';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';


const webhookHandler = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = config.stripe.stripe_webhook_secret;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not set');
    res.status(500).send('Webhook secret not configured');
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
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Check if the event is valid
  if (!event) {
    logger.error('Invalid event received - event object is null or undefined');
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid event received!');
  }

  console.log('event.type', event.type);
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;

        const metadata = session.metadata || {};
        console.log("-----------------meta----------data-----------",metadata);

        
        if (metadata.purchaseId && metadata.raffleId) {
          // 🎟️ Raffle Payment
          // await handlePayment.handleRaffleBuy(session);
        } else if (metadata.doonerId && metadata.causeId) {
          // 💝 Charity Donation
          // await handlePayment.handleDonate(session);
        } else {
          console.log('⚠️ Unknown payment type received in webhook');
        }
        break;
      }

      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Error handling the event:', err);
    res.status(500).send(`Internal Server Error: ${err.message}`);
  }
};

export default webhookHandler;

// handleTransferCreated
const handleTransferCreated = async (transfer: Stripe.Transfer) => {
  try {
    console.log(`Transfer for user ${transfer.destination} created`);
  } catch (error) {
    console.error('Error in handleTransferCreated:', error);
  }
};
