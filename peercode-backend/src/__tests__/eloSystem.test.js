'use strict';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const { eloCalculator, calculateEloDelta, updateEloRating } = require('../utils/eloSystem');
const { ELO_FLOOR, DELTA } = require('../constants/elo.constants');

describe('eloCalculator', () => {
  test('winner gains ELO, loser loses ELO', () => {
    const { newEloA, newEloB } = eloCalculator(1200, 1200, 1, 0);
    expect(newEloA).toBeGreaterThan(1200);
    expect(newEloB).toBeLessThan(1200);
  });

  test('sum of ratings is conserved (approximately)', () => {
    const { newEloA, newEloB } = eloCalculator(1400, 1200, 1, 0);
    expect(Math.abs((newEloA + newEloB) - (1400 + 1200))).toBeLessThanOrEqual(2);
  });

  test('higher-rated player gains less when winning', () => {
    const { newEloA: gainHighRated } = eloCalculator(1600, 1000, 1, 0);
    const { newEloA: gainLowRated } = eloCalculator(1000, 1600, 1, 0);
    expect(gainHighRated - 1600).toBeLessThan(gainLowRated - 1000);
  });

  test('draw gives equal outcome for equal ratings', () => {
    const { newEloA, newEloB } = eloCalculator(1200, 1200, 0.5, 0.5);
    expect(newEloA).toBe(1200);
    expect(newEloB).toBe(1200);
  });
});

describe('calculateEloDelta', () => {
  test('returns positive delta for solved easy problem', () => {
    const delta = calculateEloDelta({ difficulty: 'easy', solved: true, duration: 600, timeLimit: 2700, testsPassed: 3, totalTests: 3, codeLength: 100 });
    expect(delta).toBeGreaterThan(0);
  });

  test('returns negative delta for unsolved hard problem', () => {
    const delta = calculateEloDelta({ difficulty: 'hard', solved: false, duration: 2700, timeLimit: 2700, testsPassed: 0, totalTests: 3, codeLength: 100 });
    expect(delta).toBeLessThan(0);
  });

  test('applies speed bonus when solved fast', () => {
    const slow = calculateEloDelta({ difficulty: 'medium', solved: true, duration: 2500, timeLimit: 2700, testsPassed: 2, totalTests: 2, codeLength: 100 });
    const fast = calculateEloDelta({ difficulty: 'medium', solved: true, duration: 500, timeLimit: 2700, testsPassed: 2, totalTests: 2, codeLength: 100 });
    expect(fast).toBeGreaterThan(slow);
  });

  test('does NOT apply all-tests bonus when solved is false', () => {
    const deltaUnsolved = calculateEloDelta({ difficulty: 'medium', solved: false, duration: 600, timeLimit: 2700, testsPassed: 3, totalTests: 3, codeLength: 100 });
    const deltaSolved = calculateEloDelta({ difficulty: 'medium', solved: true, duration: 600, timeLimit: 2700, testsPassed: 3, totalTests: 3, codeLength: 100 });
    expect(deltaSolved).toBeGreaterThan(deltaUnsolved);
  });

  test('applies no-code penalty when code is too short', () => {
    const withCode    = calculateEloDelta({ difficulty: 'easy', solved: false, codeLength: 200 });
    const withoutCode = calculateEloDelta({ difficulty: 'easy', solved: false, codeLength: 10 });
    expect(withoutCode).toBeLessThan(withCode);
  });
});

describe('updateEloRating', () => {
  test('enforces ELO floor', () => {
    expect(updateEloRating(810, -100)).toBe(ELO_FLOOR);
  });

  test('applies positive delta correctly', () => {
    expect(updateEloRating(1200, 15)).toBe(1215);
  });
});
