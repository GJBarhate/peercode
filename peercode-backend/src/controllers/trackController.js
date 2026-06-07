'use strict';

const Track = require('../models/Track');
const User = require('../models/User');
const UserTrackProgress = require('../models/UserTrackProgress');
const { fail } = require('../utils/httpResponse');

async function getTracks(req, res) {
  const tracks = await Track.find({ isActive: true }).lean();
  res.json(tracks);
}

async function getTrack(req, res) {
  const track = await Track.findOne({ slug: req.params.slug }).populate('problems.problem');
  if (!track) {
    return fail(res, 404, 'Track not found');
  }
  res.json(track);
}

async function getAllTracksProgress(req, res) {
  const tracks = await Track.find({ isActive: true }).lean();

  const progressDocs = await UserTrackProgress.find({
    user: req.user.id,
  }).lean();

  const progressByTrack = {};
  for (const p of progressDocs) {
    progressByTrack[p.track.toString()] = p;
  }

  const result = tracks.map((track) => {
    const progress = progressByTrack[track._id.toString()];
    const totalProblems = track.problems.length;
    const completed = progress ? progress.completedProblems.length : 0;

    return {
      track: track._id,
      slug: track.slug,
      name: track.name,
      company: track.company,
      totalProblems,
      completedProblems: completed,
      progressPct: totalProblems > 0 ? Math.round((completed / totalProblems) * 100) : 0,
      completedAt: progress?.completedAt || null,
    };
  });

  res.json(result);
}

async function getTrackProgress(req, res) {
  const track = await Track.findOne({ slug: req.params.slug }).populate('problems.problem', 'title slug difficulty');
  if (!track) {
    return fail(res, 404, 'Track not found');
  }

  const user = await User.findById(req.user.id).lean();

  const progress = await UserTrackProgress.findOne({
    user: req.user.id,
    track: track._id,
  }).lean();

  const solvedSet = new Set(
    (user?.solvedProblems || []).map((sp) => sp.problem.toString())
  );

  const totalProblems = track.problems.length;
  const completed = progress ? progress.completedProblems.length : 0;

  const problems = track.problems.map((tp) => {
    const prob = tp.problem;
    return {
      _id: prob?._id || tp.problem,
      title: prob?.title || null,
      slug: prob?.slug || null,
      difficulty: prob?.difficulty || null,
      order: tp.order,
      solved: prob ? solvedSet.has(prob._id.toString()) : false,
    };
  });

  res.json({
    track: {
      _id: track._id,
      name: track.name,
      slug: track.slug,
      company: track.company,
    },
    totalProblems,
    completedProblems: completed,
    progressPct: totalProblems > 0 ? Math.round((completed / totalProblems) * 100) : 0,
    completedAt: progress?.completedAt || null,
    problems,
  });
}

async function completeProblem(req, res) {
  const track = await Track.findOne({ slug: req.params.slug });
  if (!track) {
    return fail(res, 404, 'Track not found');
  }

  const { problemId, sessionId } = req.body;
  if (!problemId) {
    return fail(res, 400, 'problemId is required');
  }

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

  const alreadyCompleted = progress.completedProblems.some(
    (cp) => cp.problem && cp.problem.toString() === problemId.toString()
  );

  if (!alreadyCompleted) {
    progress.completedProblems.push({
      problem: problemId,
      completedAt: new Date(),
      sessionId: sessionId || null,
    });
  }

  const totalProblems = track.problems.length;
  const isTrackComplete = progress.completedProblems.length >= totalProblems;
  if (isTrackComplete && !progress.completedAt) {
    progress.completedAt = new Date();
  }

  await progress.save();

  res.json({ progress, isTrackComplete });
}

module.exports = { getTracks, getTrack, getAllTracksProgress, getTrackProgress, completeProblem };
