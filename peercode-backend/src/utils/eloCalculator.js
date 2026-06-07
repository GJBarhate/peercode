'use strict';

function eloCalculator(ratingA, ratingB, scoreA, scoreB) {
  const K = 32;
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const newEloA = Math.round(ratingA + K * (scoreA - expectedA));
  const newEloB = Math.round(ratingB + K * (scoreB - (1 - expectedA)));
  return { newEloA, newEloB };
}

module.exports = { eloCalculator };
