'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPlans, createSubscription, verifyPayment, cancelSubscription, razorpayWebhook, getSubscriptionStatus, getCancelInfo } = require('../controllers/subscriptionController');

router.get('/plans', getPlans);
router.get('/status', auth, getSubscriptionStatus);
router.post('/create', auth, createSubscription);
router.post('/verify-payment', auth, verifyPayment);
router.post('/cancel-info', auth, getCancelInfo);
router.post('/cancel', auth, cancelSubscription);
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

module.exports = router;