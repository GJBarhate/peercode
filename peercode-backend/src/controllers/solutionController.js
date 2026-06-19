'use strict';

const Solution = require('../models/Solution');
const Problem = require('../models/Problem');
const { fail } = require('../utils/httpResponse');

async function getSolutions(req, res) {
  const { problemId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const problem = await Problem.findById(problemId);
  if (!problem) return fail(res, 404, 'Problem not found');

  const total = await Solution.countDocuments({ problem: problemId });
  const solutions = await Solution.find({ problem: problemId })
    .populate('user', 'username')
    .sort({ upvotes: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ solutions, total, page, totalPages: Math.ceil(total / limit) });
}

async function createSolution(req, res) {
  const { problemId } = req.params;
  const { code, language, explanation } = req.body;

  if (!code || !language) return fail(res, 400, 'Code and language are required');

  const problem = await Problem.findById(problemId);
  if (!problem) return fail(res, 404, 'Problem not found');

  const solution = await Solution.create({
    problem: problemId,
    user: req.user.id,
    code,
    language,
    explanation: explanation || '',
  });

  await solution.populate('user', 'username');
  res.status(201).json(solution);
}

async function upvoteSolution(req, res) {
  const solution = await Solution.findByIdAndUpdate(
    req.params.id,
    { $inc: { upvotes: 1 } },
    { new: true }
  );
  if (!solution) return fail(res, 404, 'Solution not found');
  res.json(solution);
}

module.exports = { getSolutions, createSolution, upvoteSolution };
