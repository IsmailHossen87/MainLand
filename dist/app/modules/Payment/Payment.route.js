"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRouter = void 0;
const express_1 = require("express");
const handlePaymentSuccess_1 = require("../../handlears/handlePaymentSuccess");
const router = (0, express_1.Router)();
router.get('/success', handlePaymentSuccess_1.handlePayment.paymentSuccess);
router.get('/cancel', handlePaymentSuccess_1.handlePayment.paymentCancel);
exports.PaymentRouter = router;
