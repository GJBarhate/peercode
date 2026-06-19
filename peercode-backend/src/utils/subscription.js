'use strict';

const { PLAN_LIMITS, PLAN_PRICES } = require('../constants/plans.constants');

function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

function getPlanPrice(plan) {
  return PLAN_PRICES[plan] || 0;
}

function canUseFeature(user, feature) {
  const plan = user.subscription?.plan || 'free';
  const limits = getPlanLimits(plan);
  const usage = user.usage || { hintsUsed: 0, analyzesUsed: 0 };

  if (limits[feature] === Infinity) return { allowed: true, remaining: Infinity };

  // Reset counters if a new monthly period has started
  const now = new Date();
  const periodStart = usage.periodStart ? new Date(usage.periodStart) : now;
  const monthDiff = (now.getFullYear() - periodStart.getFullYear()) * 12 + (now.getMonth() - periodStart.getMonth());
  if (monthDiff >= 1) {
    usage.hintsUsed = 0;
    usage.analyzesUsed = 0;
    usage.periodStart = now;
  }

  const used = feature === 'hints' ? usage.hintsUsed : usage.analyzesUsed;
  const remaining = Math.max(0, limits[feature] - used);

  return { allowed: used < limits[feature], remaining, limit: limits[feature], used };
}

async function incrementUsage(user, feature) {
  const now = new Date();
  const usage = user.usage || { hintsUsed: 0, analyzesUsed: 0, periodStart: now };
  
  const periodStart = usage.periodStart ? new Date(usage.periodStart) : now;
  const monthDiff = (now.getFullYear() - periodStart.getFullYear()) * 12 + (now.getMonth() - periodStart.getMonth());
  
  if (monthDiff >= 1) {
    usage.hintsUsed = 0;
    usage.analyzesUsed = 0;
    usage.periodStart = now;
  }
  
  if (feature === 'hints') usage.hintsUsed += 1;
  else if (feature === 'analyzes') usage.analyzesUsed += 1;
  
  user.usage = usage;
  await user.save();
  return user;
}

function getUsageInfo(user) {
  const plan = user.subscription?.plan || 'free';
  const limits = getPlanLimits(plan);
  const usage = user.usage || { hintsUsed: 0, analyzesUsed: 0, periodStart: new Date() };
  
  return {
    plan,
    hints: { used: usage.hintsUsed || 0, limit: limits.hints, remaining: limits.hints === Infinity ? Infinity : Math.max(0, limits.hints - (usage.hintsUsed || 0)) },
    analyzes: { used: usage.analyzesUsed || 0, limit: limits.analyzes, remaining: limits.analyzes === Infinity ? Infinity : Math.max(0, limits.analyzes - (usage.analyzesUsed || 0)) },
    periodStart: usage.periodStart,
    price: getPlanPrice(plan)
  };
}

module.exports = { getPlanLimits, getPlanPrice, canUseFeature, incrementUsage, getUsageInfo, PLAN_LIMITS, PLAN_PRICES };