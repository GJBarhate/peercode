'use strict';

module.exports = {
  K_FACTOR: 32,
  ELO_DIVISOR: 400,
  DEFAULT_ELO: 1200,
  ELO_FLOOR: 800,
  PROVISIONAL_MATCHES: 10,
  MATCH_WINDOW: 200,

  DELTA: {
    EASY:   { WIN:  8, LOSS:  -2 },
    MEDIUM: { WIN: 15, LOSS:  -5 },
    HARD:   { WIN: 25, LOSS: -10 },
    SPEED_BONUS:    5,
    ALL_TESTS_BONUS: 3,
    NO_CODE_PENALTY: 3,
  },

  FAST_SOLVE_THRESHOLD: 0.6,
  MIN_CODE_LENGTH:      50,
};
