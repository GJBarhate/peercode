'use strict';

const {
  K_FACTOR,
  ELO_DIVISOR,
  ELO_FLOOR,
  DELTA,
  FAST_SOLVE_THRESHOLD,
  MIN_CODE_LENGTH,
} = require('../constants/elo.constants');

/**
 * Classic ELO update for head-to-head results.
 * scoreA / scoreB in [0,1] — typically 1=win, 0=loss, 0.5=draw, or normalized rating.
 */
function eloCalculator(ratingA, ratingB, scoreA, scoreB) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / ELO_DIVISOR));
  const newEloA = Math.round(ratingA + K_FACTOR * (scoreA - expectedA));
  const newEloB = Math.round(ratingB + K_FACTOR * (scoreB - (1 - expectedA)));
  return { newEloA, newEloB };
}

/**
 * Calculate ELO delta based on problem difficulty and performance.
 * Note: all-tests bonus only applies when `solved` is true to prevent
 * gaming via visible-tests-only passes.
 */
function calculateEloDelta(params) {
  const {
    difficulty,
    solved,
    duration,
    timeLimit,
    testsPassed,
    totalTests,
    codeLength,
  } = params;

  let delta = 0;

  const tier = DELTA[(difficulty || '').toUpperCase()];
  if (tier) delta = solved ? tier.WIN : tier.LOSS;

  if (solved && duration && timeLimit && duration < timeLimit * FAST_SOLVE_THRESHOLD) {
    delta += DELTA.SPEED_BONUS;
  }

  if (solved && testsPassed === totalTests && totalTests > 0) {
    delta += DELTA.ALL_TESTS_BONUS;
  }

  if (!codeLength || codeLength < MIN_CODE_LENGTH) {
    delta -= DELTA.NO_CODE_PENALTY;
  }

  return delta;
}

function updateEloRating(currentElo, delta) {
  return Math.max(ELO_FLOOR, currentElo + delta);
}

module.exports = { eloCalculator, calculateEloDelta, updateEloRating };
