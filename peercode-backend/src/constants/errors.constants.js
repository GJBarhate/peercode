'use strict';

module.exports = {
  AUTH: {
    MISSING_TOKEN:     'Authentication required',
    INVALID_TOKEN:     'Invalid or expired token',
    INSUFFICIENT_ROLE: 'Insufficient permissions',
    ACCOUNT_LOCKED:    'Account is temporarily locked. Try again later.',
    ACCOUNT_BANNED:    'Your account has been suspended.',
    EMAIL_UNVERIFIED:  'Please verify your email before logging in.',
  },

  ROOM: {
    NOT_FOUND:         'Room not found',
    FULL:              'Room is full',
    NOT_PARTICIPANT:   'You are not a participant of this room',
    ALREADY_ENDED:     'Session has already ended',
    INVALID_STATE:     'Invalid room state',
  },

  PROBLEM: {
    NOT_FOUND:         'Problem not found',
    NOT_IN_TRACK:      'Problem is not part of this track',
    INVALID_SEARCH:    'Invalid search query',
  },

  SESSION: {
    NOT_FOUND:         'Session not found',
    ACCESS_DENIED:     'Access denied',
    ALREADY_COMPLETED: 'Session is already completed',
  },

  GENERIC: {
    INTERNAL_ERROR:    'An internal server error occurred',
    NOT_FOUND:         'Resource not found',
    VALIDATION:        'Validation failed',
    RATE_LIMITED:      'Too many requests. Please slow down.',
  },
};
