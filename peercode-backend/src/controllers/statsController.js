'use strict';

const User = require('../models/User');
const Session = require('../models/Session');
const Problem = require('../models/Problem');
const AiDebrief = require('../models/AiDebrief');
const { fail } = require('../utils/httpResponse');
const logger = require('../utils/logger');

let platformStatsCache = null;
let platformStatsCacheTime = 0;
const CACHE_TTL = 60_000;

async function getPlatformStats(req, res) {
  try {
    const now = Date.now();
    if (platformStatsCache && now - platformStatsCacheTime < CACHE_TTL) {
      return res.json(platformStatsCache);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalUsers, totalMatches, totalProblems, matchesToday, eloAgg] = await Promise.all([
      User.countDocuments({ isBanned: { $ne: true } }),
      Session.countDocuments({ status: 'completed' }),
      Problem.countDocuments({ isActive: true }),
      Session.countDocuments({ startTime: { $gte: todayStart } }),
      User.aggregate([
        { $match: { isBanned: { $ne: true } } },
        { $group: { _id: null, avg: { $avg: '$elo' } } },
      ]),
    ]);

    const avgElo = eloAgg[0]?.avg ? Math.round(eloAgg[0].avg) : 1200;

    platformStatsCache = {
      totalUsers,
      totalMatches,
      totalProblems,
      matchesToday,
      avgElo,
    };
    platformStatsCacheTime = now;

    res.json(platformStatsCache);
  } catch (err) {
    logger.error('Platform stats error:', err.message);
    return fail(res, 500, 'Failed to fetch platform stats');
  }
}

async function getUserStats(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).lean();
    if (!user) return fail(res, 404, 'User not found');

    const recentMatches = await Session.find({
      participants: userId,
      status: 'completed',
    })
      .populate('problem', 'title difficulty slug')
      .sort({ createdAt: -1 })
      .limit(20)
      .select('roomId participants problem problemSnapshot eloData duration startTime testResults')
      .lean();

    const matchHistory = recentMatches.map(s => {
      const eloEntry = (s.eloData || []).find(e => e.userId?.toString() === userId);
      return {
        sessionId: s._id,
        roomId: s.roomId,
        problem: s.problem?.title || s.problemSnapshot?.title || 'Practice',
        difficulty: s.problem?.difficulty || s.problemSnapshot?.difficulty || 'medium',
        result: s.testResults?.allPassed ? 'solved' : 'attempted',
        eloDelta: eloEntry?.delta || 0,
        duration: s.duration || 0,
        date: s.startTime || s.createdAt,
      };
    });

    // Compute rank
    const usersAbove = await User.countDocuments({
      isBanned: { $ne: true },
      elo: { $gt: user.elo },
    });
    const totalActive = await User.countDocuments({ isBanned: { $ne: true } });
    const globalRank = usersAbove + 1;
    const percentile = totalActive > 0 ? Math.round(((totalActive - usersAbove) / totalActive) * 100) : 0;

    const eloHistory = (user.eloHistory || []).slice(-90);

    res.json({
      elo: user.elo,
      rank: globalRank,
      percentile,
      stats: user.stats || {},
      eloHistory,
      streak: user.streakData || { currentStreak: 0, longestStreak: 0 },
      badges: user.badges || [],
      recentMatches: matchHistory,
    });
  } catch (err) {
    logger.error('User stats error:', err.message);
    return fail(res, 500, 'Failed to fetch user stats');
  }
}

async function getLeaderboard(req, res) {
  try {
    const { period = 'all', page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const matchFilter = { isBanned: { $ne: true } };

    if (period === 'weekly') {
      matchFilter['stats.totalMatches'] = { $gt: 0 };
    } else if (period === 'monthly') {
      matchFilter['stats.totalMatches'] = { $gt: 0 };
    }

    const [users, total] = await Promise.all([
      User.find(matchFilter)
        .sort({ elo: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('username elo profilePicture stats.wins stats.winRate stats.totalMatches')
        .lean(),
      User.countDocuments(matchFilter),
    ]);

    const ranked = users.map((u, i) => ({
      username: u.username,
      elo: u.elo,
      rank: skip + i + 1,
      profilePicture: u.profilePicture,
      wins: u.stats?.wins || 0,
      winRate: u.stats?.winRate || 0,
      totalMatches: u.stats?.totalMatches || 0,
    }));

    // Include requesting user's rank if authenticated
    let userRank = null;
    if (req.user?.id) {
      const userAbove = await User.countDocuments({
        isBanned: { $ne: true },
        elo: { $gt: req.user.elo || 1200 },
      });
      userRank = userAbove + 1;
    }

    res.json({
      users: ranked,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      userRank,
    });
  } catch (err) {
    logger.error('Leaderboard error:', err.message);
    return fail(res, 500, 'Failed to fetch leaderboard');
  }
}

module.exports = { getPlatformStats, getUserStats, getLeaderboard };
