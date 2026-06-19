'use strict';

module.exports = {
  QUEUE_TIMEOUT_MS:      60_000,
  MAX_PARTICIPANTS:      2,
  MAX_OBSERVERS:         5,
  ELO_MATCH_WINDOW:      200,
  TIME_LIMIT_DEFAULT_S:  2700,  // 45 minutes in seconds
  SNAPSHOT_DEBOUNCE_MS:  5_000,
  MAX_CHAT_MESSAGES:     100,
  MAX_MESSAGE_LENGTH:    500,
  ROOM_TTL_HOURS:        2,
  CLEANUP_INTERVAL_MS:   30 * 60 * 1000,
};
