'use strict';

const User = require('../models/User');
const logger = require('../utils/logger');

let lastSnapshot = [];

async function fetchTop100() {
  return User.find({ isBanned: { $ne: true } })
    .sort({ elo: -1 })
    .limit(100)
    .select('username elo profilePicture stats.wins stats.totalMatches stats.winRate')
    .lean();
}

function buildRanked(users) {
  return users.map((u, i) => ({
    rank: i + 1,
    username: u.username,
    elo: u.elo,
    profilePicture: u.profilePicture,
    wins: u.stats?.wins || 0,
    totalMatches: u.stats?.totalMatches || 0,
    winRate: u.stats?.winRate || 0,
  }));
}

function diffRows(prev, next) {
  const prevMap = new Map(prev.map(r => [r.username, r]));
  return next.filter(r => {
    const p = prevMap.get(r.username);
    return !p || p.rank !== r.rank || p.elo !== r.elo;
  });
}

function initLeaderboardSocket(io) {
  const lbNs = io.of('/leaderboard');

  lbNs.on('connection', async (socket) => {
    try {
      const users = lastSnapshot.length ? lastSnapshot : await fetchTop100();
      lastSnapshot = users;
      socket.emit('leaderboard-snapshot', buildRanked(users));
    } catch (err) {
      logger.error('Leaderboard initial emit error:', err.message);
    }
  });

  const interval = setInterval(async () => {
    try {
      if (lbNs.sockets.size === 0) return;
      const users = await fetchTop100();
      const ranked = buildRanked(users);
      const diff = diffRows(buildRanked(lastSnapshot), ranked);
      lastSnapshot = users;
      if (diff.length > 0) {
        lbNs.emit('leaderboard-update', diff);
      }
    } catch (err) {
      logger.error('Leaderboard broadcast error:', err.message);
    }
  }, 5 * 60 * 1000);

  lbNs.on('close', () => clearInterval(interval));

  return lbNs;
}

module.exports = initLeaderboardSocket;
