'use strict';

const User = require('../models/User');
const Session = require('../models/Session');
const logger = require('../utils/logger');

const BADGE_DEFINITIONS = [
  { id: 'B001', name: 'First Blood', icon: '⚔️', description: 'Win your first match' },
  { id: 'B002', name: 'Speed Demon', icon: '⚡', description: 'Solve a Medium in under 8 minutes' },
  { id: 'B003', name: 'Comeback King', icon: '👑', description: 'Win a match with < 10 minutes remaining' },
  { id: 'B004', name: 'On Fire', icon: '🔥', description: '7-day match streak' },
  { id: 'B005', name: 'Centurion', icon: '💯', description: 'Solve 100 problems total' },
  { id: 'B006', name: 'Polyglot', icon: '🌐', description: 'Submit in 3+ different languages' },
  { id: 'B007', name: 'Untouchable', icon: '🛡️', description: 'Win 5 matches in a row' },
  { id: 'B008', name: 'The Grinder', icon: '⛏️', description: '500 total Judge0 submissions' },
  { id: 'B009', name: 'Algorithm Sage', icon: '🧠', description: 'Solve 10 DP-tagged problems' },
  { id: 'B010', name: 'Code Reviewer', icon: '📋', description: 'Generate AI debrief 20 times' },
  { id: 'B011', name: 'Problem Slayer', icon: '🗡️', description: 'Solve a Hard problem' },
  { id: 'B012', name: 'Social Butterfly', icon: '🦋', description: 'Rate 10 peers' },
  { id: 'B013', name: 'Subscriber', icon: '💳', description: 'Purchase any paid plan' },
  { id: 'B014', name: 'Elite Coder', icon: '💎', description: 'Reach ELO 1600' },
  { id: 'B015', name: 'Grandmaster', icon: '🏆', description: 'Reach ELO 1800' },
  { id: 'B016', name: 'Early Adopter', icon: '🌟', description: 'Account created before launch' },
  { id: 'B017', name: 'Track Champion', icon: '🎯', description: 'Complete an entire track' },
  { id: 'B018', name: 'Perfectionist', icon: '✨', description: '100% acceptance rate (min 20 subs)' },
  { id: 'B019', name: 'Consistent', icon: '📅', description: '30-day login streak' },
  { id: 'B020', name: 'Legend', icon: '👁️', description: 'Top 1% ELO globally' },
];

function getBadgeDefinitions() {
  return BADGE_DEFINITIONS;
}

function hasBadge(user, badgeId) {
  return (user.badges || []).some(b => b.id === badgeId);
}

async function checkAndAwardBadges(userId, context = {}) {
  try {
    const user = await User.findById(userId).lean();
    if (!user) return [];

    const earned = user.badges || [];
    const earnedIds = new Set(earned.map(b => b.id));
    const newBadges = [];

    const stats = user.stats || {};
    const { won, difficulty, duration, tags, languages } = context;

    // B001: First Blood — win first match
    if (!earnedIds.has('B001') && (won || stats.wins >= 1)) {
      newBadges.push('B001');
    }

    // B002: Speed Demon — solve medium in under 8 min (480s)
    if (!earnedIds.has('B002') && won && difficulty === 'medium' && duration && duration < 480) {
      newBadges.push('B002');
    }

    // B003: Comeback King — win with < 10 min remaining
    if (!earnedIds.has('B003') && won && context.timeRemaining != null && context.timeRemaining < 600) {
      newBadges.push('B003');
    }

    // B004: On Fire — 7-day streak
    if (!earnedIds.has('B004') && user.streakData?.currentStreak >= 7) {
      newBadges.push('B004');
    }

    // B005: Centurion — 100 problems solved
    if (!earnedIds.has('B005') && (user.solvedProblems?.length >= 100 || stats.totalAccepted >= 100)) {
      newBadges.push('B005');
    }

    // B006: Polyglot — 3+ languages
    if (!earnedIds.has('B006')) {
      const langCount = stats.languageUsage instanceof Map
        ? stats.languageUsage.size
        : Object.keys(stats.languageUsage || {}).length;
      if (langCount >= 3) newBadges.push('B006');
    }

    // B007: Untouchable — 5 wins in a row
    if (!earnedIds.has('B007') && won) {
      const recentSessions = await Session.find({ participants: userId, status: 'completed' })
        .sort({ createdAt: -1 }).limit(5).select('testResults').lean();
      if (recentSessions.length >= 5 && recentSessions.every(s => s.testResults?.allPassed)) {
        newBadges.push('B007');
      }
    }

    // B008: The Grinder — 500 submissions
    if (!earnedIds.has('B008') && stats.totalSubmissions >= 500) {
      newBadges.push('B008');
    }

    // B009: Algorithm Sage — 10 DP problems
    if (!earnedIds.has('B009')) {
      const dpCount = stats.solvedByTag instanceof Map
        ? (stats.solvedByTag.get('Dynamic Programming') || stats.solvedByTag.get('dp') || 0)
        : (stats.solvedByTag?.['Dynamic Programming'] || stats.solvedByTag?.dp || 0);
      if (dpCount >= 10) newBadges.push('B009');
    }

    // B010: Code Reviewer — 20 debriefs
    if (!earnedIds.has('B010') && context.totalDebriefs >= 20) {
      newBadges.push('B010');
    }

    // B011: Problem Slayer — solve a Hard problem
    if (!earnedIds.has('B011') && won && difficulty === 'hard') {
      newBadges.push('B011');
    }

    // B013: Subscriber — any paid plan
    if (!earnedIds.has('B013') && user.subscription?.plan && user.subscription.plan !== 'free') {
      newBadges.push('B013');
    }

    // B014: Elite Coder — ELO 1600
    if (!earnedIds.has('B014') && user.elo >= 1600) {
      newBadges.push('B014');
    }

    // B015: Grandmaster — ELO 1800
    if (!earnedIds.has('B015') && user.elo >= 1800) {
      newBadges.push('B015');
    }

    // B017: Track Champion — completed a track
    if (!earnedIds.has('B017') && context.trackCompleted) {
      newBadges.push('B017');
    }

    // B018: Perfectionist — 100% acceptance rate, min 20 submissions
    if (!earnedIds.has('B018') && stats.totalSubmissions >= 20 && stats.acceptanceRate === 100) {
      newBadges.push('B018');
    }

    // B019: Consistent — 30-day streak
    if (!earnedIds.has('B019') && user.streakData?.currentStreak >= 30) {
      newBadges.push('B019');
    }

    // B020: Legend — top 1% ELO
    if (!earnedIds.has('B020')) {
      const totalUsers = await User.countDocuments({ isBanned: { $ne: true } });
      const usersAbove = await User.countDocuments({ isBanned: { $ne: true }, elo: { $gt: user.elo } });
      const percentile = totalUsers > 0 ? ((totalUsers - usersAbove) / totalUsers) * 100 : 0;
      if (percentile >= 99) newBadges.push('B020');
    }

    if (newBadges.length > 0) {
      const badgeEntries = newBadges.map(id => ({ id, earnedAt: new Date() }));
      await User.updateOne(
        { _id: userId },
        { $push: { badges: { $each: badgeEntries } } }
      );
      logger.info(`Awarded badges to user ${userId}: ${newBadges.join(', ')}`);
    }

    return newBadges.map(id => BADGE_DEFINITIONS.find(b => b.id === id)).filter(Boolean);
  } catch (err) {
    logger.error('Badge check error:', err.message);
    return [];
  }
}

module.exports = { checkAndAwardBadges, getBadgeDefinitions, BADGE_DEFINITIONS };
