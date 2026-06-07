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

  // Dev mode: if Razorpay not configured or fails, return mock URL
  const isDev = process.env.NODE_ENV === 'development';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // In dev mode, skip Razorpay and use mock immediately
  if (isDev) {
    const mockUrl = `${frontendUrl}/subscription?payment=success&mock=true&plan=${planId}`;
    if (!user.subscription) user.subscription = {};
    user.subscription.plan = planId;
    user.subscription.status = 'active';
    user.subscription.currentPeriodStart = new Date();
    user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();
    
    return success(res, { 
      paymentLinkId: `mock_${Date.now()}`,
      shortUrl: mockUrl,
      planId,
      amount: PLAN_PRICES[planId],
      mock: true
    }, 'Dev mode: mock payment link');
  }

  try {
    const rzp = getRazorpay();
    let customerId = user.subscription?.razorpayCustomerId;
    
    if (!customerId) {
      const customer = await rzp.customers.create({
        name: user.username,
        email: user.email,
        contact: '',
        fail_existing: '0'
      });
      customerId = customer.id;
      user.subscription.razorpayCustomerId = customerId;
    }

    const planPrice = PLAN_PRICES[planId];
    
    const paymentLink = await rzp.paymentLink.create({
      amount: planPrice * 100,
      currency: 'INR',
      accept_partial: false,
      description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan Subscription`,
      customer: { id: customerId, name: user.username, email: user.email },
      notify: { sms: false, email: true },
      reminder_enable: true,
      notes: { userId: user.id, planId, type: 'subscription' },
      callback_url: frontendUrl + '/subscription?payment=success',
      callback_method: 'get'
    });

    user.subscription.plan = planId;
    user.subscription.status = 'pending';
    user.subscription.razorpayPaymentLinkId = paymentLink.id;
    user.subscription.razorpayPaymentLinkUrl = paymentLink.short_url;
    await user.save();

    success(res, { 
      paymentLinkId: paymentLink.id,
      shortUrl: paymentLink.short_url,
      planId,
      amount: planPrice
    }, 'Payment link created. Complete payment to activate subscription.');
  } catch (err) {
    logger.error('Create subscription error:', err);
    
    // Dev fallback: return mock checkout URL and auto-activate
    if (isDev) {
      const mockUrl = `${frontendUrl}/subscription?payment=success&mock=true&plan=${planId}`;
      user.subscription.plan = planId;
      user.subscription.status = 'active';
      user.subscription.currentPeriodStart = new Date();
      user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.save();
      
      return success(res, { 
        paymentLinkId: `mock_${Date.now()}`,
        shortUrl: mockUrl,
        planId,
        amount: PLAN_PRICES[planId],
        mock: true
      }, 'Dev mode: mock payment link');
    }
    
    if (err.message?.includes('Razorpay credentials not configured')) {
      return fail(res, 500, 'Payment system not configured. Contact admin.');
    }
    fail(res, 500, err.message || 'Failed to create subscription');
  }
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

module.exports = { getPlans, createSubscription, cancelSubscription, razorpayWebhook, getSubscriptionStatus };