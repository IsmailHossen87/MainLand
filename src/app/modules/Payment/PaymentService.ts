import { RafflePurchase } from './../ORGANIZER/raffel/RafflePurchase/purchase.model';
import stripe from '../../config/stripe.config';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import Raffle from '../ORGANIZER/raffel/raffel.model';
import { Charities } from '../ORGANIZER/Charities/Charities.Model';
import { Dooner } from '../ORGANIZER/Charities/Donner.model';
import mongoose from 'mongoose';
import Stripe from 'stripe';

const createPaymentIntent = async (
  raffleId: string,
  ticket: string,
  userData: {
    firstName: string;
    surName: string;
    email: string;
    message?: string;
  }
) => {
  const raffle = await Raffle.findById(raffleId);

  if (!raffle) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Raffle not found!');
  }

  const ticketCount = Number(ticket);
  if (raffle.targetsold - raffle.sold < ticketCount) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Not enough tickets available!'
    );
  }

  const totalAmount = Number(raffle.amount) * ticketCount;

  const purchase = await RafflePurchase.create({
    raffleId,
    firstName: userData.firstName,
    surName: userData.surName,
    email: userData.email,
    message: userData.message || '',
    ticket: ticketCount,
    totalAmount,
    paymentStatus: 'pending',
  });

  const stripeCustomer = await stripe.customers.create({
    name: `${userData.firstName} ${userData.surName}`,
    email: userData.email,
  });

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer: stripeCustomer.id,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Raffle Tickets - ${raffle.raffleName}`,
            description: `${ticketCount} ticket(s) @ $${raffle.amount} each`,
          },
          unit_amount: Number(raffle.amount) * 100,
        },
        quantity: ticketCount,
      },
    ],
    metadata: {
      purchaseId: purchase._id.toString(),
      raffleId: raffle._id.toString(),
      ticketCount: String(ticketCount),
      totalAmount: String(totalAmount),
    },
    success_url: `${config.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.stripe.cancel_url}?purchase_id=${purchase._id}`,
  });

  // 🔥 STEP 3: Purchase এ session ID save করুন
  await RafflePurchase.findByIdAndUpdate(purchase._id, {
    stripeSessionId: stripeSession.id,
  });

  return {
    url: stripeSession.url,
    sessionId: stripeSession.id,
    purchaseId: purchase._id,
  };
};

const createPaymentIntentCarity = async (
  causeId: string,
  amount: string,
  userData: {
    firstName: string;
    surName: string;
    email: string;
    message?: string;
  }
) => {
  const charity = await Charities.findById(causeId);
  if (!charity) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Charity not found!');
  }

  const DonateAmount = Number(amount);
  if (isNaN(DonateAmount)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid donation amount');
  }

  // Find or create donor
  let donner = await Dooner.findOne({ email: userData.email });
  if (!donner) {
    donner = await Dooner.create({
      email: userData.email,
      firstName: userData.firstName,
      surName: userData.surName,
      message: userData.message || '',
      totalAmount: "",
      paymentStatus: 'pending',
      causeId: new mongoose.Types.ObjectId(causeId),
    });
  } else {
    donner.totalAmount = 0;
    donner.paymentStatus = 'pending';
    donner.message = userData.message || donner.message;
    donner.causeId = new mongoose.Types.ObjectId(causeId);
    await donner.save();
  }

  // Create or reuse Stripe customer
  let stripeCustomerId = donner.stripeCustomerId;
  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      name: `${userData.firstName} ${userData.surName}`,
      email: userData.email,
    });
    stripeCustomerId = stripeCustomer.id;
    donner.stripeCustomerId = stripeCustomerId;
    await donner.save();
  }

  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer: stripeCustomerId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Donation for - ${charity.pageTitle}`,
          },
          unit_amount: Math.round(DonateAmount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      doonerId: donner._id.toString(),
      causeId: causeId,
      totalAmount: DonateAmount.toString(),
    },
    success_url: `${config.stripe.success_url}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.stripe.cancel_url}?purchase_id=${donner._id}`,
  });

  await Dooner.findByIdAndUpdate(donner._id, {
    stripeSessionId: stripeSession.id,
  });

  return {
    url: stripeSession.url,
    sessionId: stripeSession.id,
    donnerId: donner._id,
  };
};

export const createPaymentService = {
  createPaymentIntent,
  createPaymentIntentCarity,
};
