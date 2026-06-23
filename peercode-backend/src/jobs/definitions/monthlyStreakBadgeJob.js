'use strict';

const User = require('../../models/User');
const Session = require('../../models/Session');
const logger = require('../../utils/logger');

function daysInMonth(year, monthIndexZeroBased) {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}

// Awards a "Perfect Month" streak badge to any user who completed at least
// one session on every single calendar day of the just-finished month.
// Run once a day shortly after midnight — only does real work on the 1st,
// when the previous month has just closed out. Uses Session records
// directly (the same canonical source as the dashboard's streak display)
// rather than the incrementally-cached streakData field, which can drift.
async function checkMonthlyStreakBadges() {
  const now = new Date();
  if (now.getDate() !== 1) return { checked: 0, awarded: 0 };

  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // last day of previous month
  const prevMonthYear = prevMonthEnd.getFullYear();
  const prevMonthIndex = prevMonthEnd.getMonth();
  const monthKey = `${prevMonthYear}-${String(prevMonthIndex + 1).padStart(2, '0')}`;
  const totalDays = daysInMonth(prevMonthYear, prevMonthIndex);

  const monthStart = new Date(prevMonthYear, prevMonthIndex, 1, 0, 0, 0);
  const monthEndExclusive = new Date(prevMonthYear, prevMonthIndex + 1, 1, 0, 0, 0);

  const perUserDays = await Session.aggregate([
    {
      $match: {
        status: 'completed',
        startTime: { $gte: monthStart, $lt: monthEndExclusive },
      },
    },
    { $unwind: '$participants' },
    {
      $project: {
        participant: '$participants',
        day: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
      },
    },
    {
      $group: {
        _id: { participant: '$participant', day: '$day' },
      },
    },
    {
      $group: {
        _id: '$_id.participant',
        activeDays: { $sum: 1 },
      },
    },
    { $match: { activeDays: { $gte: totalDays } } },
  ]);

  let awarded = 0;
  for (const { _id: userId } of perUserDays) {
    const user = await User.findOne({ _id: userId, isBanned: { $ne: true } }).select('monthlyStreakBadges');
    if (!user) continue;

    const alreadyAwarded = (user.monthlyStreakBadges || []).some(b => b.month === monthKey);
    if (alreadyAwarded) continue;

    await User.updateOne(
      { _id: userId },
      { $push: { monthlyStreakBadges: { month: monthKey, earnedAt: new Date() } } }
    );
    awarded += 1;
  }

  logger.info(`Monthly streak badge check for ${monthKey}: ${perUserDays.length} qualified, ${awarded} newly awarded`);
  return { checked: perUserDays.length, awarded };
}

module.exports = function defineMonthlyStreakBadgeJob(agenda) {
  agenda.define('monthly-streak-badge-check', async () => {
    try {
      await checkMonthlyStreakBadges();
    } catch (err) {
      logger.error('Monthly streak badge job error:', err.message);
    }
  });
};

module.exports.checkMonthlyStreakBadges = checkMonthlyStreakBadges;
