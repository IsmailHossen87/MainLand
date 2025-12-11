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
        console.error('Stripe webhook secret not set');
        res.status(500).send('Webhook secret not configured');
        return;
    }
    let event;
    try {
        event = stripe_config_1.default.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    if (!event) {
        logger_1.logger.error('Invalid event received - event object is null or undefined');
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid event received!');
    }
    console.log('event.type', event.type);
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const metadata = session.metadata || {};
                // Ensure attendee info is included before calling handler
                session.attendeeInformation = {
                    email: metadata.email,
                    phone: metadata.phone,
                };
                if (metadata.type === 'resellPurchase') {
                    yield handlePaymentSuccess_1.handlePayment.repurchaseTicket(session);
                }
                else if (metadata.eventId && metadata.userId) {
                    yield handlePaymentSuccess_1.handlePayment.handleEvent(session);
                }
                else {
                    console.log('⚠️ Unknown payment type received in webhook');
                }
                break;
            }
            case 'transfer.created':
                console.log(`Transfer created for:`, event.data.object);
                break;
            case 'account.updated':
                const data = event.data.object;
                console.log('session', event.data.object);
                const email = data.email;
                const accountId = data.id;
                const loginLink = yield stripe_config_1.default.accounts.createLoginLink(accountId);
                console.log('loginLink', loginLink.url);
                // await User.updateOne({ email }, { $set: { 'stripeAccountInfo.$.loginUrl': loginLink.url } });
                yield user_model_1.User.updateOne({ email }, {
                    $set: {
                        "stripeAccountInfo.loginUrl": loginLink.url
                    }
                });
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
                break;
        }
        res.status(200).json({ received: true });
    }
    catch (err) {
        console.error('Error handling the event:', err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    }
});
exports.default = webhookHandler;
