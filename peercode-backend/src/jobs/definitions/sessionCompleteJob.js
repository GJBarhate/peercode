'use strict';

const Session = require('../../models/Session');
const User = require('../../models/User');
const logger = require('../../utils/logger');

function getTodayMidnightUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getYesterdayMidnightUTC() {
  const d = getTodayMidnightUTC();
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

async function updateStreak(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const today = getTodayMidnightUTC();
  const yesterday = getYesterdayMidnightUTC();
  const last = user.streakData.lastSessionDate
    ? new Date(user.streakData.lastSessionDate).getTime()
    : null;

  let { currentStreak, longestStreak } = user.streakData;

  if (last === null) {
    currentStreak = 1;
  } else if (last === yesterday.getTime()) {
    currentStreak += 1;
  } else if (last === today.getTime()) {
    // same day — no change
  } else {
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        'streakData.currentStreak': currentStreak,
        'streakData.longestStreak': longestStreak,
        'streakData.lastSessionDate': today,
      },
    }
  );
}

module.exports = function defineSessionCompleteJob(agenda) {
  agenda.define('session-complete', async (job) => {
    try {
      const { roomId, participantIds } = job.attrs.data;

      const session = await Session.findOne({ roomId });
      const now = new Date();

      if (session) {
        const startTime = session.startTime || session.createdAt || now;
        const duration = Math.round((now - new Date(startTime)) / 1000);
        await Session.findOneAndUpdate(
          { roomId },
          { $set: { endTime: now, duration } }
        );
      }

      await agenda.now('rating-update', { roomId, participantIds });

      if (session && participantIds && participantIds.length > 0) {
        const users = await User.find({ _id: { $in: participantIds } }).select('email username');
        for (const u of users) {
          await agenda.now('send-email', {
            to: u.email,
            subject: 'Your PeerCode session has ended',
            html: `<p>Hi ${u.username},</p><p>Your coding session in room <strong>${roomId}</strong> has ended. Duration: ${session ? Math.round((now - new Date(session.startTime || session.createdAt)) / 60) : 'N/A'} minutes.</p><p>Your AI debrief will be ready shortly.</p>`,
          });
        }
      }

      await agenda.now('ai-debrief', { roomId, participantIds });

      if (participantIds && participantIds.length > 0) {
        for (const participantId of participantIds) {
          await updateStreak(participantId);
        }
      }
    } catch (err) {
      logger.error('Session complete job error:', err.message);
      // Don't re-throw - let Agenda consider the job done even if it fails
      // This prevents cascading failures of downstream jobs
    }
  });
};
