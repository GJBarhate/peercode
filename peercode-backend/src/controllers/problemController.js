'use strict';

const Problem = require('../models/Problem');
const ProblemReport = require('../models/ProblemReport');
const Track = require('../models/Track');
const User = require('../models/User');
const UserTrackProgress = require('../models/UserTrackProgress');
const Session = require('../models/Session');
const { fail } = require('../utils/httpResponse');

async function aggregateProblemStats() {
  try {
    const stats = await Session.aggregate([
      { $match: { problem: { $exists: true, $ne: null } } },
      { $group: {
        _id: '$problem',
        totalSubmissions: { $sum: 1 },
        passedSubmissions: { $sum: { $cond: ['$testResults.allPassed', 1, 0] } },
        solvers: { $addToSet: { $cond: ['$testResults.allPassed', '$participants', null] } },
      }},
    ]);
    const map = new Map();
    for (const s of stats) {
      const flatSolvers = new Set();
      (s.solvers || []).forEach(g => { if (Array.isArray(g)) g.forEach(u => u && flatSolvers.add(String(u))); });
      map.set(String(s._id), {
        totalSubmissions: s.totalSubmissions || 0,
        passedSubmissions: s.passedSubmissions || 0,
        solvedCount: flatSolvers.size,
        acceptance: s.totalSubmissions > 0 ? Math.round((s.passedSubmissions / s.totalSubmissions) * 100) : 0,
      });
    }
    return map;
  } catch (e) {
    return new Map();
  }
}

async function getProblemStats(req, res) {
  const [total, easy, medium, hard] = await Promise.all([
    Problem.countDocuments({ isActive: true }),
    Problem.countDocuments({ isActive: true, difficulty: 'easy' }),
    Problem.countDocuments({ isActive: true, difficulty: 'medium' }),
    Problem.countDocuments({ isActive: true, difficulty: 'hard' }),
  ]);
  res.json({ total, easy, medium, hard });
}

async function getProblems(req, res) {
  const { difficulty, companies, tags, search, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };

  if (difficulty) filter.difficulty = difficulty;
  if (companies) filter.companies = { $in: Array.isArray(companies) ? companies : [companies] };
  if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.title = { $regex: escaped, $options: 'i' };
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [problems, total, statsMap] = await Promise.all([
    Problem.find(filter)
      .select('-hiddenTests')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Problem.countDocuments(filter),
    aggregateProblemStats(),
  ]);

  // User's solved set
  let solvedSet = new Set();
  if (req.user?.id) {
    try {
      const userSessions = await Session.find({
        participants: req.user.id,
        'testResults.allPassed': true,
        problem: { $exists: true, $ne: null },
      }).select('problem').lean();
      solvedSet = new Set(userSessions.map(s => String(s.problem)));
    } catch (_) {}
  }

  const enriched = problems.map(p => {
    const stats = statsMap.get(String(p._id)) || { totalSubmissions: 0, passedSubmissions: 0, solvedCount: 0, acceptance: 0 };
    return {
      ...p,
      acceptanceRate: stats.acceptance,
      totalSubmissions: stats.totalSubmissions,
      solvedCount: stats.solvedCount,
      solvedByMe: solvedSet.has(String(p._id)),
    };
  });

  res.json({
    problems: enriched,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
}

async function getProblem(req, res) {
  const { slug } = req.params
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug)
  const query = isObjectId
    ? { $or: [{ slug }, { _id: slug }], isActive: true }
    : { slug, isActive: true }
  const problem = await Problem.findOne(query).select('-hiddenTests').lean()
  if (!problem) {
    return fail(res, 404, 'Problem not found')
  }

  const statsMap = await aggregateProblemStats()
  const stats = statsMap.get(String(problem._id)) || { totalSubmissions: 0, passedSubmissions: 0, solvedCount: 0, acceptance: 0 }
  problem.acceptanceRate = stats.acceptance || problem.acceptanceRate || 0
  problem.totalSubmissions = stats.totalSubmissions
  problem.solvedCount = stats.solvedCount

  if (req.user?.id) {
    try {
      const solved = await Session.findOne({
        participants: req.user.id,
        problem: problem._id,
        'testResults.allPassed': true,
      }).select('_id').lean()
      problem.solvedByMe = !!solved
    } catch (_) {}
  }

  res.json(problem)
}

const PROBLEM_ALLOWED_FIELDS = [
  'title', 'slug', 'description', 'difficulty', 'companies', 'examples',
  'hiddenTests', 'tags', 'constraints', 'timeLimit', 'memoryLimit',
  'isActive', 'stubs', 'testCases', 'starterCode', 'codeTemplates',
  'testHarness', 'hints', 'editorial', 'solutions',
];

function pickAllowed(body) {
  const picked = {};
  for (const key of PROBLEM_ALLOWED_FIELDS) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
}

async function createProblem(req, res) {
  const problem = await Problem.create(pickAllowed(req.body));
  res.status(201).json(problem);
}

async function updateProblem(req, res) {
  const problem = await Problem.findByIdAndUpdate(req.params.id, pickAllowed(req.body), {
    new: true,
    runValidators: true,
  });
  if (!problem) {
    return fail(res, 404, 'Problem not found');
  }
  res.json(problem);
}

async function reportProblem(req, res) {
  const allowedTypes = new Set(['wrong-answer', 'broken-testcase', 'unclear-description', 'other']);
  const type = String(req.body.type || '').trim();
  const description = String(req.body.description || '').trim().replace(/<[^>]*>/g, '');

  if (!allowedTypes.has(type)) {
    return fail(res, 400, 'Invalid report type');
  }

  if (description.length < 10 || description.length > 500) {
    return fail(res, 400, 'Description must be between 10 and 500 characters');
  }

  const problem = await Problem.findById(req.params.id);
  if (!problem) {
    return fail(res, 404, 'Problem not found');
  }

  const report = await ProblemReport.create({
    problem: req.params.id,
    reportedBy: req.user.id,
    type,
    description,
  });

  res.status(201).json(report);
}

async function solveProblem(req, res) {
  const problem = await Problem.findOne({ slug: req.params.slug, isActive: true });
  if (!problem) {
    return fail(res, 404, 'Problem not found');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return fail(res, 404, 'User not found');
  }

  const alreadySolved = user.solvedProblems.some(
    (sp) => sp.problem.toString() === problem._id.toString()
  );

  if (!alreadySolved) {
    user.solvedProblems.push({ problem: problem._id, solvedAt: new Date() });
    await user.save();
  }

  const tracksWithProblem = await Track.find({ 'problems.problem': problem._id });
  if (tracksWithProblem.length > 0) {
    const trackIds = tracksWithProblem.map(t => t._id);
    const existingProgress = await UserTrackProgress.find({
      user: req.user.id,
      track: { $in: trackIds },
    });
    const progressMap = new Map(existingProgress.map(p => [p.track.toString(), p]));

    const bulkOps = [];
    for (const track of tracksWithProblem) {
      const existing = progressMap.get(track._id.toString());
      const existingCompleted = existing?.completedProblems || [];
      const alreadyInTrack = existingCompleted.some(
        cp => cp.problem && cp.problem.toString() === problem._id.toString()
      );
      if (alreadyInTrack) continue;

      const newCount = existingCompleted.length + 1;
      const isTrackComplete = newCount >= track.problems.length;
      const setFields = isTrackComplete && !existing?.completedAt ? { completedAt: new Date() } : {};

      bulkOps.push({
        updateOne: {
          filter: { user: req.user.id, track: track._id },
          update: {
            $push: { completedProblems: { problem: problem._id, completedAt: new Date() } },
            ...(Object.keys(setFields).length > 0 ? { $set: setFields } : {}),
          },
          upsert: true,
        },
      });
    }
    if (bulkOps.length > 0) {
      await UserTrackProgress.bulkWrite(bulkOps);
    }
  }

  // Create a solo session record so streak, heatmap, and acceptance stats work
  const now = new Date();
  const soloRoomId = `solo_${req.user.id}_${problem.slug}_${now.getTime()}`;
  try {
    const existingToday = await Session.findOne({
      participants: req.user.id,
      problem: problem._id,
      'testResults.allPassed': true,
      createdAt: { $gte: new Date(now.toISOString().split('T')[0]) },
    });
    if (!existingToday) {
      await Session.create({
        roomId: soloRoomId,
        problem: problem._id,
        problemSnapshot: { title: problem.title, difficulty: problem.difficulty, slug: problem.slug, tags: problem.tags },
        participants: [req.user.id],
        startTime: now,
        endTime: now,
        duration: 0,
        status: 'completed',
        testResults: { passed: 1, total: 1, allPassed: true },
        finalLanguage: req.body.language || 'javascript',
      });

      // Update streak for this user
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const yesterday = new Date(today); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const last = user.streakData?.lastSessionDate ? new Date(user.streakData.lastSessionDate).getTime() : null;
      let cs = user.streakData?.currentStreak || 0;
      let ls = user.streakData?.longestStreak || 0;
      if (last === null) cs = 1;
      else if (last === yesterday.getTime()) cs += 1;
      else if (last !== today.getTime()) cs = 1;
      if (cs > ls) ls = cs;
      await User.updateOne({ _id: req.user.id }, { $set: { 'streakData.currentStreak': cs, 'streakData.longestStreak': ls, 'streakData.lastSessionDate': today } });
    }
  } catch (_) {}

  // Update problem's cached acceptance rate
  try {
    const totalSessions = await Session.countDocuments({ problem: problem._id });
    const passedSessions = await Session.countDocuments({ problem: problem._id, 'testResults.allPassed': true });
    if (totalSessions > 0) {
      problem.acceptanceRate = Math.round((passedSessions / totalSessions) * 100);
      await problem.save();
    }
  } catch (_) {}

  res.json({ solved: true, problem: problem._id });
}

async function getRecommendedProblems(req, res) {
  try {
    const user = await User.findById(req.user.id).select('stats solvedProblems elo').lean();
    if (!user) return fail(res, 404, 'User not found');

    const solvedIds = new Set((user.solvedProblems || []).map(sp => String(sp.problem)));
    const solvedByTag = user.stats?.solvedByTag
      ? (user.stats.solvedByTag instanceof Map
          ? Object.fromEntries(user.stats.solvedByTag)
          : user.stats.solvedByTag)
      : {};

    const KNOWN_TAGS = ['Arrays', 'DP', 'Graphs', 'Trees', 'Greedy', 'Math', 'Strings', 'Binary Search', 'Stack', 'Queue', 'Recursion', 'Bit Manipulation', 'Hashing', 'Two Pointers', 'Sliding Window'];

    const weaknessByTag = {};
    for (const tag of KNOWN_TAGS) {
      const count = solvedByTag[tag] || solvedByTag[tag.toLowerCase()] || 0;
      weaknessByTag[tag] = 1 / (count + 1);
    }

    const elo = user.elo || 1200;
    const targetDifficulty = elo < 1250 ? 'easy' : elo < 1500 ? 'medium' : 'hard';
    const difficultyOrder = ['easy', 'medium', 'hard'];
    const targetIdx = difficultyOrder.indexOf(targetDifficulty);

    const sortedWeakTags = Object.entries(weaknessByTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    const candidates = await Problem.find({
      isActive: true,
      tags: { $in: sortedWeakTags },
      difficulty: { $in: difficultyOrder.slice(Math.max(0, targetIdx - 1), targetIdx + 2) },
    })
      .select('title slug difficulty tags description')
      .lean();

    const unsolved = candidates.filter(p => !solvedIds.has(String(p._id)));

    const scored = unsolved.map(p => {
      const matchedTags = p.tags.filter(t => sortedWeakTags.includes(t));
      const weakScore = matchedTags.reduce((acc, t) => acc + (weaknessByTag[t] || 0), 0);
      const diffBonus = p.difficulty === targetDifficulty ? 1.5 : 1;
      const reason = matchedTags.length
        ? `Strengthen your ${matchedTags[0]} skills`
        : `Matches your current level`;
      return { problem: p, weaknessScore: Math.round(weakScore * diffBonus * 100) / 100, reason };
    });

    scored.sort((a, b) => b.weaknessScore - a.weaknessScore);
    const top5 = scored.slice(0, 5);

    if (top5.length < 5) {
      const needed = 5 - top5.length;
      const existingIds = new Set(top5.map(r => String(r.problem._id)));
      const fallback = await Problem.find({
        isActive: true,
        difficulty: targetDifficulty,
        _id: { $nin: [...solvedIds, ...existingIds].map(id => require('mongoose').Types.ObjectId.createFromHexString(id)) },
      })
        .select('title slug difficulty tags description')
        .limit(needed)
        .lean();
      fallback.forEach(p => top5.push({ problem: p, weaknessScore: 0, reason: 'Good practice for your level' }));
    }

    res.json({ recommendations: top5 });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch recommendations');
  }
}

async function getDailyProblem(req, res) {
  try {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);

    const count = await Problem.countDocuments({ isActive: true });
    if (count === 0) return fail(res, 404, 'No problems available');

    const index = dayOfYear % count;
    const problem = await Problem.findOne({ isActive: true })
      .sort({ _id: 1 })
      .skip(index)
      .select('title slug difficulty tags description')
      .lean();

    if (!problem) return fail(res, 404, 'No daily problem');
    res.json({ problem });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch daily problem');
  }
}

module.exports = { getProblemStats, getProblems, getProblem, createProblem, updateProblem, reportProblem, solveProblem, getDailyProblem, getRecommendedProblems };
