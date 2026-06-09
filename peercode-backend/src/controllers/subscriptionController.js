'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const { fail, ok: success } = require('../utils/httpResponse');
const logger = require('../utils/logger');
const { PLAN_PRICES } = require('../utils/subscription');

let razorpay = null;
function getRazorpay() {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    }
    razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpay;
}

const PLAN_MAP = {
  pro: 'plan_pro',
  premium: 'plan_premium',
  ultra: 'plan_ultra'
};

async function getPlans(req, res) {
  const plans = [
    { id: 'free', name: 'Free', price: 0, currency: 'INR', interval: 'month', hints: 30, analyzes: 30, features: ['30 hints/month', '30 analyzes/month', 'Shared API pool'] },
    { id: 'pro', name: 'Pro', price: 99, currency: 'INR', interval: 'month', hints: 70, analyzes: 70, features: ['70 hints/month (30 + 40 extra)', '70 analyzes/month', 'Priority support', 'No ads'] },
    { id: 'premium', name: 'Premium', price: 299, currency: 'INR', interval: 'month', hints: 180, analyzes: 180, features: ['180 hints/month (30 + 150 extra)', '180 analyzes/month', 'Priority support', 'No ads', 'Advanced analytics'] },
    { id: 'ultra', name: 'Ultra Premium', price: 999, currency: 'INR', interval: 'month', hints: -1, analyzes: -1, features: ['Unlimited hints', 'Unlimited analyzes', 'Priority support', 'No ads', 'Advanced analytics', 'Custom AI models', 'API access'] }
  ];
  success(res, { plans });
}

async function createSubscription(req, res) {
  const { planId } = req.body;
  const user = req.user;

  if (!PLAN_MAP[planId]) {
    return fail(res, 400, 'Invalid plan');
  }

  if (!user.subscription) user.subscription = {};

  if (user.subscription?.plan === planId && user.subscription?.status === 'active') {
    return fail(res, 400, 'Already subscribed to this plan');
  }

  const planPrice = PLAN_PRICES[planId];

  try {
    const rzp = getRazorpay();

    const order = await rzp.orders.create({
      amount: planPrice * 100,
      currency: 'INR',
      receipt: `${planId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      notes: { userId: String(user._id), planId }
    });

    user.subscription.razorpayOrderId = order.id;
    user.subscription.status = 'pending';
    await user.save();

    success(res, {
      orderId: order.id,
      amount: order.amount,
      planId,
      key: process.env.RAZORPAY_KEY_ID
    }, 'Order created. Complete payment to activate subscription.');
  } catch (err) {
    logger.error('Create subscription order error:', err);

    if (err.message?.includes('Razorpay credentials not configured')) {
      return fail(res, 500, 'Payment system not configured. Contact admin.');
    }
    fail(res, 500, err.message || 'Failed to create subscription order');
  }
}

async function verifyPayment(req, res) {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId } = req.body;
  const user = req.user;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return fail(res, 400, 'Missing payment verification details');
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return fail(res, 400, 'Invalid payment signature');
  }

  if (!user.subscription) user.subscription = {};

  user.subscription.plan = planId || user.subscription.plan;
  user.subscription.status = 'active';
  user.subscription.currentPeriodStart = new Date();
  user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  user.subscription.razorpayOrderId = undefined;
  user.subscription.razorpayPaymentId = razorpay_payment_id;
  await user.save();

  success(res, { plan: user.subscription.plan, status: 'active' }, 'Payment verified. Subscription activated.');
}

async function cancelSubscription(req, res) {
  const user = req.user;

  if (!user.subscription?.plan || user.subscription.plan === 'free') {
    return fail(res, 400, 'No active subscription');
  }

  if (!user.subscription) user.subscription = {};

  try {
    user.subscription.status = 'cancelled';
    user.subscription.plan = 'free';
    user.subscription.cancelAtPeriodEnd = false;
    user.subscription.razorpayPaymentLinkId = undefined;
    user.subscription.razorpayPaymentLinkUrl = undefined;
    await user.save();
    success(res, { message: 'Subscription cancelled. You are now on the Free plan.' });
  } catch (err) {
    logger.error('Cancel subscription error:', err);
    fail(res, 500, 'Failed to cancel subscription');
  }
}

async function razorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return fail(res, 500, 'Webhook secret not configured');
  }
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (signature !== expectedSignature) {
    return fail(res, 400, 'Invalid signature');
  }

  const event = req.body.event;
  const payload = req.body.payload;

  try {
    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const paymentLinkId = payment.payment_link_id;
      if (paymentLinkId) {
        const user = await User.findOne({ 'subscription.razorpayPaymentLinkId': paymentLinkId });
        if (user && payment.notes?.planId) {
          user.subscription.status = 'active';
          user.subscription.plan = payment.notes.planId;
          user.subscription.currentPeriodStart = new Date();
          user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
          user.subscription.razorpayPaymentLinkId = undefined;
          user.subscription.razorpayPaymentLinkUrl = undefined;
          await user.save();
        }
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payment.entity;
      const paymentLinkId = payment.payment_link_id;
      if (paymentLinkId) {
        const user = await User.findOne({ 'subscription.razorpayPaymentLinkId': paymentLinkId });
        if (user) {
          user.subscription.status = 'past_due';
          user.subscription.plan = 'free';
          user.subscription.razorpayPaymentLinkId = undefined;
          user.subscription.razorpayPaymentLinkUrl = undefined;
          await user.save();
        }
      }
    }
    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

function getPlanFromRazorpayPlan(planId) {
  const reverseMap = { plan_pro: 'pro', plan_premium: 'premium', plan_ultra: 'ultra' };
  return reverseMap[planId] || 'free';
}

async function getCancelInfo(req, res) {
  const user = req.user;

  if (!user.subscription?.plan || user.subscription.plan === 'free') {
    return fail(res, 400, 'No active subscription');
  }

  const planId = user.subscription.plan;
  const planPrice = PLAN_PRICES[planId];
  const startDate = user.subscription.currentPeriodStart;

  if (!startDate) {
    return fail(res, 400, 'Subscription start date not found');
  }

  const now = new Date();
  const daysInPeriod = 30;
  const msInDay = 1000 * 60 * 60 * 24;
  const daysUsed = Math.max(1, Math.ceil((now - startDate) / msInDay));
  const dailyRate = planPrice / daysInPeriod;
  const usedAmount = Math.min(planPrice, Math.round(dailyRate * Math.min(daysUsed, daysInPeriod)));
  const refundAmount = Math.max(0, planPrice - usedAmount);

  success(res, {
    plan: planId,
    planName: PLAN_MAP[planId] ? planId.charAt(0).toUpperCase() + planId.slice(1) : 'Unknown',
    planPrice,
    daysInPeriod,
    daysUsed: Math.min(daysUsed, daysInPeriod),
    usedAmount,
    refundAmount
  });
}

async function getSubscriptionStatus(req, res) {
  const user = req.user;
  const { getUsageInfo } = require('../utils/subscription');
  const usageInfo = getUsageInfo(user);
  
  const sub = user.subscription || { plan: 'free', status: 'active' };
  
  success(res, {
    plan: sub.plan || 'free',
    status: sub.status || 'active',
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    usage: usageInfo
  });
}

module.exports = { getPlans, createSubscription, verifyPayment, cancelSubscription, razorpayWebhook, getSubscriptionStatus, getCancelInfo };