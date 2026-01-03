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
const config_1 = __importDefault(require("../../../config"));
const stripe_config_1 = __importDefault(require("../../config/stripe.config"));
const logger_1 = require("../../../shared/logger");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const handlePaymentSuccess_1 = require("../../handlears/handlePaymentSuccess");
const user_model_1 = require("../user/user.model");
const webhookHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = config_1.default.stripe.stripe_webhook_secret;
    if (!webhookSecret) {
        res.status(500).send('Stripe webhook secret not configured');
        return;
    }
    let event;
    try {
        event = stripe_config_1.default.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        logger_1.logger.error('Webhook signature verification failed', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    try {
        switch (event.type) {
            // ======================================
            // ✅ CHECKOUT PAYMENT COMPLETED
            // ======================================
            case 'checkout.session.completed': {
                const session = event.data.object;
                const metadata = session.metadata || {};
                // 🔑 Get PaymentIntent
                const paymentIntentId = session.payment_intent;
                if (!paymentIntentId) {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'PaymentIntent not found in checkout session');
                }
                const paymentIntent = yield stripe_config_1.default.paymentIntents.retrieve(paymentIntentId);
                // ✅ Ensure payment success
                if (paymentIntent.status !== 'succeeded') {
                    logger_1.logger.warn(`Payment not successful. Status: ${paymentIntent.status}`);
                    break;
                }
                console.log("session", session);
                console.log("metadata", metadata);
                // 🔁 Route by payment type
                if (metadata.type === 'resellPurchase') {
                    yield handlePaymentSuccess_1.handlePayment.repurchaseTicket(session, paymentIntent);
                }
                else if (metadata.eventId && metadata.userId) {
                    yield handlePaymentSuccess_1.handlePayment.handleEvent(session, paymentIntent);
                }
                else {
                    logger_1.logger.warn('Unknown payment type received in webhook metadata');
                }
                break;
            }
            // ======================================
            // 💸 STRIPE TRANSFER CREATED
            // ======================================
            case 'transfer.created':
                logger_1.logger.info('Transfer created', event.data.object);
                break;
            // ======================================
            // 🏦 CONNECTED ACCOUNT UPDATED
            // ======================================
            case 'account.updated': {
                const account = event.data.object;
                if (!account.email)
                    break;
                const loginLink = yield stripe_config_1.default.accounts.createLoginLink(account.id);
                yield user_model_1.User.updateOne({ email: account.email }, {
                    $set: {
                        'stripeAccountInfo.loginUrl': loginLink.url,
                    },
                });
                break;
            }
            default:
                logger_1.logger.info(`Unhandled event type: ${event.type}`);
                break;
        }
        res.status(200).json({ received: true });
    }
    catch (err) {
        logger_1.logger.error('Webhook processing error', err);
        res.status(500).send(`Webhook Error: ${err.message}`);
    }
});
exports.default = webhookHandler;
