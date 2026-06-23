'use strict';

const { agenda } = require('../config/agenda');

const defineSessionCompleteJob = require('./definitions/sessionCompleteJob');
const defineRatingUpdateJob = require('./definitions/ratingUpdateJob');
const defineEmailJob = require('./definitions/emailJob');
const defineAiDebriefJob = require('./definitions/aiDebriefJob');
const defineWeeklyDigestJob = require('./definitions/weeklyDigestJob');
const defineMonthlyStreakBadgeJob = require('./definitions/monthlyStreakBadgeJob');
const defineContestSchedulerJob = require('./definitions/contestSchedulerJob');
const logger = require('../utils/logger');

// Registered job names:
// 'session-complete'          - finalise session, trigger downstream jobs, update streaks
// 'rating-update'              - recalculate ELO for both participants
// 'send-email'                 - deliver transactional and digest emails via SMTP
// 'ai-debrief'                 - generate per-user AI feedback via Gemini
// 'weekly-digest'              - weekly summary email for all active users
// 'monthly-streak-badge-check' - award "Perfect Month" badges on the 1st of each month
// 'contest-lifecycle-tick'     - open/close contests on the Sun/Wed schedule

async function startScheduler() {
  defineSessionCompleteJob(agenda);
  defineRatingUpdateJob(agenda);
  defineEmailJob(agenda);
  defineAiDebriefJob(agenda);
  defineWeeklyDigestJob(agenda);
  defineMonthlyStreakBadgeJob(agenda);
  defineContestSchedulerJob(agenda);

  await agenda.start();

  await agenda.every('0 21 * * 0', 'weekly-digest');
  await agenda.every('5 0 * * *', 'monthly-streak-badge-check');
  await agenda.every('1 minute', 'contest-lifecycle-tick');

  logger.info('Agenda scheduler started');
}

module.exports = { startScheduler };
