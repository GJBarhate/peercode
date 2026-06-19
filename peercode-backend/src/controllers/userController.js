'use strict';

const User = require('../models/User');
const Session = require('../models/Session');
const { computeUserStreak } = require('../utils/streakCalculator');
const { fail } = require('../utils/httpResponse');

async function getProfile(req, res) {
  const userId = req.user._id || req.user.id;
  if (!userId) return fail(res, 400, 'Invalid user ID');
  const user = await User.findById(userId);
  if (!user) {
    return fail(res, 404, 'User not found');
  }

  const profile = user.toObject();
  
  // Get canonical streak calculation
  const streakData = await computeUserStreak(req.user.id);
  profile.currentStreak = streakData.currentStreak;
  profile.longestStreak = streakData.longestStreak;
  profile.activeDays = streakData.activeDays;
  profile.totalSessions = streakData.totalSessions;

  // Build activity counts per day for heatmap
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const sessions = await Session.find({ participants: req.user.id, status: 'completed', startTime: { $gte: oneYearAgo } }).select('startTime').sort({ startTime: -1 });
  const activityCounts = {};
  for (const s of sessions) {
    if (!s.startTime) continue;
    const key = new Date(s.startTime).toISOString().split('T')[0];
    activityCounts[key] = (activityCounts[key] || 0) + 1;
  }
  profile.activityCounts = activityCounts;

  res.json(profile);
}

async function updateProfile(req, res) {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';

  if (!username || username.length < 3 || username.length > 20) {
    return fail(res, 400, 'Username must be between 3 and 20 characters');
  }

  const user = await User.findByIdAndUpdate(req.user.id, { username }, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return fail(res, 404, 'User not found');
  }

  res.json(user);
}

async function updateApiKey(req, res) {
  const apiKey = typeof req.body.apiKey === 'string' ? req.body.apiKey.trim() : '';
  if (!apiKey) {
    return fail(res, 400, 'API key is required');
  }

  if (!apiKey.startsWith('AIza')) {
    return fail(res, 400, 'Invalid API key format - Gemini keys start with "AIza"');
  }

  if (apiKey.length < 30) {
    return fail(res, 400, 'API key seems too short - please check and try again');
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { apiKey },
    { new: true }
  ).select('+apiKey');

  if (!user) {
    return fail(res, 404, 'User not found');
  }

  res.json({ message: 'API key updated', apiKey: user.apiKey });
}

async function getUserSolvedProblems(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .populate('solvedProblems.problem', 'slug difficulty')
      .lean();

    if (!user) {
      return fail(res, 404, 'User not found');
    }

    const seen = new Set();
    const solvedProblems = [];
    for (const sp of user.solvedProblems || []) {
      if (sp.problem && sp.problem.slug && !seen.has(sp.problem.slug)) {
        seen.add(sp.problem.slug);
        solvedProblems.push({
          slug: sp.problem.slug,
          difficulty: sp.problem.difficulty,
        });
      }
    }

    res.json({ solvedProblems, solvedSlugs: [...seen] });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch solved problems');
  }
}

module.exports = { getProfile, updateProfile, updateApiKey, getUserSolvedProblems };
