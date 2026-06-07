'use strict';

const User = require('../models/User');
const Session = require('../models/Session');
const Problem = require('../models/Problem');
const ProblemReport = require('../models/ProblemReport');
const Room = require('../models/Room');
const { getKeyPoolStatus } = require('../config/gemini');
const { fail } = require('../utils/httpResponse');

async function getStats(req, res) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalUsers, totalSessions, totalProblems, activeRooms, subsAgg] = await Promise.all([
    User.countDocuments(),
    Session.countDocuments(),
    Problem.countDocuments({ isActive: true }),
    Room.countDocuments({ status: { $in: ['waiting', 'active'] } }),
    User.aggregate([
      { $match: { 'subscription.plan': { $ne: 'free' }, 'subscription.status': { $in: ['active', 'past_due'] } } },
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]),
  ]);

  const subscriptionStats = {
    pro: 0, premium: 0, ultra: 0,
    total: 0,
    monthlyRevenue: 0
  };
  subsAgg.forEach(s => {
    if (s._id) {
      subscriptionStats[s._id] = s.count;
      subscriptionStats.total += s.count;
    }
  });
  subscriptionStats.monthlyRevenue = (subscriptionStats.pro * 99) + (subscriptionStats.premium * 299) + (subscriptionStats.ultra * 999);

  const activeTodayCount = await Session.countDocuments({
    startTime: { $gte: todayStart },
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sessionsPerDay = await Session.aggregate([
    { $match: { startTime: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$startTime' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topProblems = await Session.aggregate([
    { $unwind: '$participants' },
    { $group: { _id: '$roomId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  res.json({
    totalUsers,
    totalSessions,
    totalProblems,
    activeRooms,
    activeTodayCount,
    sessionsPerDay,
    topProblems,
    geminiPool: getKeyPoolStatus(),
    subscriptionStats,
  });
}

async function getUsers(req, res) {
  const { page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
}

async function toggleBan(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) {
    return fail(res, 404, 'User not found');
  }
  user.isBanned = !user.isBanned;
  await user.save();
  res.json({ message: `User ${user.isBanned ? 'banned' : 'unbanned'}`, user });
}

async function getProblems(req, res) {
  const problems = await Problem.find({}).select('title slug difficulty isActive').lean();
  res.json(problems);
}

async function updateProblem(req, res) {
  const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!problem) {
    return fail(res, 404, 'Problem not found');
  }
  res.json(problem);
}

async function deleteProblem(req, res) {
  const problem = await Problem.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!problem) {
    return fail(res, 404, 'Problem not found');
  }
  res.json({ message: 'Problem soft-deleted', problem });
}

async function getReports(req, res) {
  const reports = await ProblemReport.find({ resolved: false })
    .populate('problem', 'title slug')
    .populate('reportedBy', 'username')
    .sort({ createdAt: -1 });
  res.json(reports);
}

async function resolveReport(req, res) {
  const report = await ProblemReport.findByIdAndUpdate(
    req.params.id,
    { resolved: true, resolvedBy: req.user.id },
    { new: true }
  );
  if (!report) {
    return fail(res, 404, 'Report not found');
  }
  res.json(report);
}

module.exports = {
  getStats,
  getUsers,
  toggleBan,
  getProblems,
  updateProblem,
  deleteProblem,
  getReports,
  resolveReport,
};
