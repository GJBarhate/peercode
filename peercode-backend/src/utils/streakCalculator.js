'use strict';

const Session = require('../models/Session');

/**
 * Canonical streak calculation function
 * Returns { currentStreak, longestStreak, activeDays, totalSessions }
 */
async function computeUserStreak(userId) {
  try {
    // Fetch all completed sessions for this user, sorted by date descending
    const sessions = await Session.find({
      participants: userId,
      status: 'completed'
    })
      .sort({ startTime: -1 })
      .select('startTime');

    if (sessions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        activeDays: 0,
        totalSessions: 0
      };
    }

    // Extract unique dates (YYYY-MM-DD in UTC)
    const uniqueDates = Array.from(
      new Set(
        sessions
          .filter(s => s.startTime)
          .map(s => {
            const date = new Date(s.startTime);
            return date.toISOString().split('T')[0];
          })
      )
    ).sort().reverse(); // Sort descending for streak calculation

    const totalSessions = sessions.length;
    const activeDays = uniqueDates.length;

    // Calculate current streak (from today backwards)
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (uniqueDates[i] === expectedDateStr) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 1;
    let currentCount = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i - 1]);
      const nextDate = new Date(uniqueDates[i]);
      const diffTime = currentDate - nextDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentCount++;
        longestStreak = Math.max(longestStreak, currentCount);
      } else {
        currentCount = 1;
      }
    }

    return {
      currentStreak,
      longestStreak,
      activeDays,
      totalSessions
    };
  } catch (err) {
    require('./logger').error('Error computing streak:', err);
    return {
      currentStreak: 0,
      longestStreak: 0,
      activeDays: 0,
      totalSessions: 0
    };
  }
}

module.exports = { computeUserStreak };
