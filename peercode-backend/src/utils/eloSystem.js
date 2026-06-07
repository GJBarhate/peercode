'use strict';

/**
 * Calculate ELO delta based on problem difficulty and performance
 * 
 * Base: Easy solved=+8, Easy failed=-2, Medium solved=+15, Medium failed=-5,
 *       Hard solved=+25, Hard failed=-10
 * Bonus: if duration < 60% of time limit: +5. If all test cases pass: +3.
 * Penalty: if no code written (< 50 chars): -3.
 */
function calculateEloDelta(params) {
  const {
    difficulty,
    solved,
    duration,
    timeLimit,
    testsPassed,
    totalTests,
    codeLength
  } = params;

  let delta = 0;

  // Base score
  if (difficulty === 'easy') {
    delta = solved ? 8 : -2;
  } else if (difficulty === 'medium') {
    delta = solved ? 15 : -5;
  } else if (difficulty === 'hard') {
    delta = solved ? 25 : -10;
  }

  // Bonus: fast solve (< 60% of time limit)
  if (solved && duration && timeLimit && duration < timeLimit * 0.6) {
    delta += 5;
  }

  // Bonus: all test cases pass
  if (testsPassed === totalTests && totalTests > 0) {
    delta += 3;
  }

  // Penalty: no code written (< 50 chars)
  if (!codeLength || codeLength < 50) {
    delta -= 3;
  }

  return delta;
}

/**
 * Update user ELO rating
 * Returns updated ELO rating (min: 800, no cap)
 */
function updateEloRating(currentElo, delta) {
  const newElo = Math.max(800, currentElo + delta);
  return newElo;
}

module.exports = { calculateEloDelta, updateEloRating };
