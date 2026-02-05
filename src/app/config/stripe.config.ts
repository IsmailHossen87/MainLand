import Stripe from 'stripe';
import config from '../../config';

const stripe = new Stripe(config.stripe.secret_key as string, {
  apiVersion: "2025-09-30.clover",
});

export default stripe;
