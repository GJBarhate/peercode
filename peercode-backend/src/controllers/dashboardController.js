'use strict';

const User = require('../models/User');
const Session = require('../models/Session');
const { computeUserStreak } = require('../utils/streakCalculator');
const { ok: success, fail } = require('../utils/httpResponse');
const logger = require('../utils/logger');

async function getDashboard(req, res) {
  try {
    const userId = req.user.id || req.user.userId;

    // Get user profile
    const user = await User.findById(userId);
    if (!user) {
      return fail(res, 404, 'User not found');
    }

    // Get all sessions for this user
    const sessions = await Session.find({ participants: userId })
      .populate('problem', 'title difficulty slug tags')
      .sort({ createdAt: -1 })
      .limit(50)
      .select('roomId participants createdAt duration endTime startTime status testResults eloAtStart eloAtEnd eloDelta problemSnapshot problem finalCode finalLanguage');

    // Calculate streak
    const streakData = await computeUserStreak(userId);

    // Format sessions for dashboard
    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      roomId: session.roomId,
      createdAt: session.createdAt,
      duration: session.duration || 0,
      status: session.status,
      testResults: session.testResults,
      eloDelta: session.eloDelta || 0,
      eloAtEnd: session.eloAtEnd || user.elo,
      problemSnapshot: (() => {
        const snap = session.problemSnapshot || {};
        const valid = snap.title && snap.title !== 'Unknown Problem';
        return {
          title: valid ? snap.title : (session.problem?.title || 'Practice Session'),
          difficulty: snap.difficulty || session.problem?.difficulty || 'medium',
          slug: snap.slug || session.problem?.slug || '',
          tags: snap.tags?.length ? snap.tags : (session.problem?.tags || []),
        };
      })()
    }));

    // Calculate stats
    const totalSessions = formattedSessions.length;
    const passedSessions = formattedSessions.filter(s => s.testResults?.allPassed).length;
    const passRate = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;
    const avgDuration = totalSessions > 0 
      ? Math.round(formattedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions / 60)
      : 0;

    // Build ELO history chart (last 90 data points)
    const eloHistory = formattedSessions
      .filter(s => s.eloAtEnd)
      .slice(0, 90)
      .reverse()
      .map((s, i) => ({ index: i + 1, elo: s.eloAtEnd, date: s.createdAt }));

    // Return dashboard data
    return success(res, {
      profile: {
        userId: user._id,
        username: user.username,
        email: user.email,
        elo: user.elo || 1200,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        activeDays: streakData.activeDays,
        totalSessions: streakData.totalSessions
      },
      stats: {
        totalSessions,
        passedSessions,
        passRate,
        avgDuration
      },
      sessions: formattedSessions,
      eloHistory,
    }, 'Dashboard data retrieved');
  } catch (err) {
    logger.error('Dashboard error:', err);
    return fail(res, 500, 'Failed to load dashboard');
  }
}

module.exports = { getDashboard };
