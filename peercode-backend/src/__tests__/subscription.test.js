'use strict';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const { canUseFeature, getPlanLimits } = require('../utils/subscription');
const { PLAN_LIMITS } = require('../constants/plans.constants');

function makeUser(plan, hintsUsed = 0, analyzesUsed = 0, periodStart = new Date()) {
  return {
    subscription: { plan },
    usage: { hintsUsed, analyzesUsed, periodStart },
  };
}

describe('canUseFeature', () => {
  test('returns allowed=false when hint limit is reached for free plan', () => {
    const user = makeUser('free', PLAN_LIMITS.free.hints, 0);
    const result = canUseFeature(user, 'hints');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test('returns allowed=true when under hint limit', () => {
    const user = makeUser('free', 0, 0);
    const result = canUseFeature(user, 'hints');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(PLAN_LIMITS.free.hints);
  });

  test('ultra plan has infinite hints', () => {
    const user = makeUser('ultra', 9999, 9999);
    const result = canUseFeature(user, 'hints');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  test('resets usage after monthly period boundary', () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const user = makeUser('free', PLAN_LIMITS.free.hints, 0, lastMonth);
    const result = canUseFeature(user, 'hints');
    expect(result.allowed).toBe(true);
  });

  test('analyzes limit works independently', () => {
    const user = makeUser('pro', 0, PLAN_LIMITS.pro.analyzes);
    const hintResult = canUseFeature(user, 'hints');
    const analyzeResult = canUseFeature(user, 'analyzes');
    expect(hintResult.allowed).toBe(true);
    expect(analyzeResult.allowed).toBe(false);
  });
});

describe('getPlanLimits', () => {
  test('free plan returns correct limits', () => {
    expect(getPlanLimits('free')).toEqual(PLAN_LIMITS.free);
  });

  test('unknown plan falls back to free', () => {
    expect(getPlanLimits('nonexistent')).toEqual(PLAN_LIMITS.free);
  });
});
