'use strict';

const Session = require('../models/Session');
const AiDebrief = require('../models/AiDebrief');
const { agenda } = require('../config/agenda');
const { computeDiffs } = require('../utils/diffEngine');
const { ok: success, fail } = require('../utils/httpResponse');
const logger = require('../utils/logger');

async function getSession(req, res) {
  const session = await Session.findOne({ roomId: req.params.roomId });
  if (!session) {
    return fail(res, 404, 'Session not found');
  }
  res.json(session);
}

async function getPlayback(req, res) {
  const session = await Session.findOne({ roomId: req.params.roomId });
  if (!session) {
    return fail(res, 404, 'Session not found');
  }
  const diffs = computeDiffs(session.snapshots || []);
  res.json({ roomId: session.roomId, diffs });
}

async function endSession(req, res) {
  const session = await Session.findOne({ roomId: req.params.roomId });
  if (!session) {
    return fail(res, 404, 'Session not found');
  }

  await agenda.now('session-complete', {
    roomId: req.params.roomId,
    participantIds: session.participants.map((p) => p.toString()),
  });

  res.json({ message: 'Session end scheduled' });
}

async function getDebrief(req, res) {
  let session = await Session.findOne({ roomId: req.params.roomId }).populate('problem', 'title difficulty slug description');
  if (!session) {
    session = await Session.findById(req.params.roomId).populate('problem', 'title difficulty slug description');
  }
  if (!session) {
    return fail(res, 404, 'Session not found');
  }
  const isParticipant = session.participants.some(
    (p) => p.toString() === req.user.id.toString()
  );
  if (!isParticipant) {
    return fail(res, 403, 'You are not a participant in this session');
  }
  if (!session.debrief) {
    return fail(res, 404, 'Debrief not found');
  }
  const debrief = await AiDebrief.findById(session.debrief);
  if (!debrief) {
    return fail(res, 404, 'Debrief data not found');
  }
  // Merge debrief with session info for the frontend
  const merged = {
    ...debrief.toObject(),
    problemTitle: session.problemSnapshot?.title || session.problem?.title || 'Practice Session',
    problemSlug: session.problemSnapshot?.slug || session.problem?.slug || '',
    problemDifficulty: session.problemSnapshot?.difficulty || session.problem?.difficulty || 'medium',
    problemDescription: session.problem?.description || '',
    sessionDate: session.startTime || session.createdAt,
    duration: session.duration || 0,
    strengths: debrief.whatWentWell || [],
    improvements: debrief.areasToImprove || [],
    studyTopics: debrief.studyNext || [],
    tips: debrief.studyNext || [],
    timeComplexity: debrief.weakTopics?.[0] || null,
    spaceComplexity: debrief.weakTopics?.[1] || null,
    communication: debrief.scores?.communication || 0,
    problemDecomposition: debrief.scores?.decomposition || 0,
    codeQuality: debrief.scores?.codeQuality || 0,
    complexityAwareness: debrief.scores?.complexity || 0,
  };
  success(res, merged, 'Debrief retrieved');
}

async function getAnalytics(req, res) {
  const session = await Session.findOne({ roomId: req.params.roomId });
  if (!session) {
    return fail(res, 404, 'Session not found');
  }

  const isParticipant = session.participants.some(
    (p) => p.toString() === req.user.id.toString()
  );
  if (!isParticipant) {
    return fail(res, 403, 'You are not a participant in this session');
  }

  const snapshots = session.snapshots || [];
  const totalSnapshots = snapshots.length;

  let approachCount = 0;
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1].code || '';
    const curr = snapshots[i].code || '';
    if (prev.length > 0 && curr.length < prev.length * 0.3) {
      approachCount++;
    }
  }

  const pauseSegments = [];
  for (let i = 1; i < snapshots.length; i++) {
    const timeDiff =
      new Date(snapshots[i].timestamp) - new Date(snapshots[i - 1].timestamp);
    if (timeDiff > 60000) {
      pauseSegments.push({
        startIndex: i - 1,
        endIndex: i,
        durationSeconds: Math.round(timeDiff / 1000),
      });
    }
  }

  const codeGrowthCurve = snapshots.map((snap) => ({
    timestamp: snap.timestamp,
    lineCount: snap.code ? snap.code.split('\n').length : 0,
  }));

  let linesWrittenTotal = 0;
  let linesDeletedTotal = 0;
  for (let i = 1; i < snapshots.length; i++) {
    const prev = (snapshots[i - 1].code || '').split('\n');
    const curr = (snapshots[i].code || '').split('\n');
    const prevSet = new Set(prev);
    const currSet = new Set(curr);
    linesWrittenTotal += curr.filter((l) => !prevSet.has(l)).length;
    linesDeletedTotal += prev.filter((l) => !currSet.has(l)).length;
  }

  const languagesUsed = [...new Set(snapshots.map((s) => s.language).filter(Boolean))];

  res.json({
    totalSnapshots,
    approachCount,
    pauseSegments,
    codeGrowthCurve,
    linesWrittenTotal,
    linesDeletedTotal,
    languagesUsed,
  });
}

async function getUserSessions(req, res) {
  try {
    const sessions = await Session.find({ participants: req.user.id })
      .populate('problem', 'title difficulty slug tags')
      .sort({ createdAt: -1 })
      .select('roomId participants createdAt duration endTime startTime ratingReceived problemTitle problem problemSnapshot status testResults eloData eloAtStart eloAtEnd eloDelta finalCode finalLanguage debrief');

    const serializedSessions = sessions.map((session) => {
      const durationMinutes = session.duration != null
        ? session.duration
        : session.startTime && session.endTime
          ? Math.max(0, Math.round((session.endTime - session.startTime) / 60000))
          : 0;

      return {
        ...session.toObject(),
        durationMinutes,
        // Ensure problemSnapshot has all needed fields
        problemSnapshot: session.problemSnapshot || {
          title: session.problem?.title || session.problemTitle || 'Unknown Problem',
          difficulty: session.problem?.difficulty || 'unknown',
          slug: session.problem?.slug || '',
          tags: session.problem?.tags || []
        }
      };
    });
    
    res.json(serializedSessions);
  } catch (err) {
    logger.error('Error fetching user sessions:', err);
    fail(res, 500, 'Failed to fetch sessions');
  }
}

module.exports = { getSession, getPlayback, endSession, getDebrief, getAnalytics, getUserSessions };
