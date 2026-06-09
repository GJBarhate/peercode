'use strict';

const User = require('../../models/User');
const Session = require('../../models/Session');
const logger = require('../../utils/logger');

module.exports = function defineWeeklyDigestJob(agenda) {
  agenda.define('weekly-digest', async (job) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentSessions = await Session.find({
      startTime: { $gte: sevenDaysAgo },
    }).lean();

    const userSessionMap = new Map();
    for (const session of recentSessions) {
      for (const participantId of session.participants || []) {
        const uid = participantId.toString();
        if (!userSessionMap.has(uid)) {
          userSessionMap.set(uid, []);
        }
        userSessionMap.get(uid).push(session);
      }
    }

    const BATCH_SIZE = 50;
    const entries = Array.from(userSessionMap.entries());
    for (let batch = 0; batch < entries.length; batch += BATCH_SIZE) {
      const batchEntries = entries.slice(batch, batch + BATCH_SIZE);
      await Promise.all(batchEntries.map(async ([userId, sessions]) => {
        try {
          const user = await User.findById(userId);
          if (!user || user.isBanned) return;

          const weaknessEntries = user.weaknessProfile instanceof Map
            ? [...user.weaknessProfile.entries()]
            : Object.entries(user.weaknessProfile || {});

          const topWeakTopics = weaknessEntries
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([topic]) => topic);

          const sessionCount = sessions.length;
          const topicsHtml =
            topWeakTopics.length > 0
              ? `<ul>${topWeakTopics.map((t) => `<li>${t}</li>`).join('')}</ul>`
              : '<p>No weakness data yet — keep practicing!</p>';

          const html = `
<h2>Your Weekly PeerCode Digest</h2>
<p>Hi ${user.username},</p>
<p>Here is your summary for the past 7 days:</p>
<ul>
  <li><strong>Sessions completed:</strong> ${sessionCount}</li>
  <li><strong>Current ELO rating:</strong> ${user.elo}</li>
  <li><strong>Current streak:</strong> ${user.streakData.currentStreak} days</li>
  <li><strong>Longest streak:</strong> ${user.streakData.longestStreak} days</li>
</ul>
<h3>Top areas to improve:</h3>
${topicsHtml}
<p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard">Visit your dashboard</a> to continue practicing.</p>
<p>Keep coding!</p>
<p>— The PeerCode Team</p>
          `.trim();

          await agenda.now('send-email', {
            to: user.email,
            subject: 'Your Weekly PeerCode Digest',
            html,
          });
        } catch (err) {
          logger.error(`Weekly digest error for user ${userId}:`, err.message);
        }
      }));
      if (batch + BATCH_SIZE < entries.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  });
};
