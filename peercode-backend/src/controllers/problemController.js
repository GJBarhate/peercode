'use strict';

const Problem = require('../models/Problem');
const ProblemReport = require('../models/ProblemReport');
const Track = require('../models/Track');
const User = require('../models/User');
const UserTrackProgress = require('../models/UserTrackProgress');
const { fail } = require('../utils/httpResponse');

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
  if (search) filter.title = { $regex: search, $options: 'i' };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [problems, total] = await Promise.all([
    Problem.find(filter)
      .select('-hiddenTests')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Problem.countDocuments(filter),
  ]);

  res.json({
    problems,
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
  const problem = await Problem.findOne(query).select('-hiddenTests')
  if (!problem) {
    return fail(res, 404, 'Problem not found')
  }
  res.json(problem)
}

async function createProblem(req, res) {
  const problem = await Problem.create(req.body);
  res.status(201).json(problem);
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

async function reportProblem(req, res) {
  const allowedTypes = new Set(['wrong-answer', 'broken-testcase', 'unclear-description', 'other']);
  const type = String(req.body.type || '').trim();
  const description = String(req.body.description || '').trim();

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
  for (const track of tracksWithProblem) {
    let progress = await UserTrackProgress.findOne({
      user: req.user.id,
      track: track._id,
    });

    if (!progress) {
      progress = new UserTrackProgress({
        user: req.user.id,
        track: track._id,
        completedProblems: [],
      });
    }

    const alreadyInTrack = progress.completedProblems.some(
      (cp) => cp.problem && cp.problem.toString() === problem._id.toString()
    );

    if (!alreadyInTrack) {
      progress.completedProblems.push({
        problem: problem._id,
        completedAt: new Date(),
      });
    }

    const totalProblems = track.problems.length;
    const isTrackComplete = progress.completedProblems.length >= totalProblems;
    if (isTrackComplete && !progress.completedAt) {
      progress.completedAt = new Date();
    }

    await progress.save();
  }

  res.json({ solved: true, problem: problem._id });
}

module.exports = { getProblemStats, getProblems, getProblem, createProblem, updateProblem, reportProblem, solveProblem };
