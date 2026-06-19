'use strict';

const User = require('../models/User');
const Session = require('../models/Session');
const Problem = require('../models/Problem');
const logger = require('../utils/logger');

let cachedStats = null;
let cacheTime = 0;
const CACHE_TTL = 30_000;
const BROADCAST_INTERVAL = 30_000;

async function fetchStats() {
  const now = Date.now();
  if (cachedStats && now - cacheTime < CACHE_TTL) return cachedStats;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalUsers, totalMatches, totalProblems, matchesToday, onlineCount] = await Promise.all([
    User.countDocuments({ isBanned: { $ne: true } }),
    Session.countDocuments({ status: 'completed' }),
    Problem.countDocuments({ isActive: true }),
    Session.countDocuments({ startTime: { $gte: todayStart } }),
    Promise.resolve(0),
  ]);

  cachedStats = { totalUsers, totalMatches, totalProblems, matchesToday, onlineNow: onlineCount };
  cacheTime = now;
  return cachedStats;
}

function initStatsSocket(io) {
  const statsNs = io.of('/stats');

  statsNs.on('connection', async (socket) => {
    try {
      const stats = await fetchStats();
      stats.onlineNow = statsNs.sockets.size;
      socket.emit('stats-update', stats);
    } catch (err) {
      logger.error('Stats socket initial emit error:', err.message);
    }
  });

  const interval = setInterval(async () => {
    try {
      cacheTime = 0;
      const stats = await fetchStats();
      stats.onlineNow = statsNs.sockets.size;
      statsNs.emit('stats-update', stats);
    } catch (err) {
      logger.error('Stats broadcast error:', err.message);
    }
  }, BROADCAST_INTERVAL);

  statsNs.on('close', () => clearInterval(interval));

  return statsNs;
}

module.exports = initStatsSocket;
