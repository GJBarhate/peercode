'use strict';

const PLAN_LIMITS = {
  free: { hints: 30, analyzes: 30 },
  pro: { hints: 70, analyzes: 70 },
  premium: { hints: 180, analyzes: 180 },
  ultra: { hints: Infinity, analyzes: Infinity },
};

const PLAN_PRICES = {
  free: 0,
  pro: 99,
  premium: 299,
  ultra: 999,
};

const PLAN_NAMES = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
  ultra: 'Ultra',
};

module.exports = { PLAN_LIMITS, PLAN_PRICES, PLAN_NAMES };
