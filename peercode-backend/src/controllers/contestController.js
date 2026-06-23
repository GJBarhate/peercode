'use strict';

const Contest = require('../models/Contest');
const { ok: success, fail } = require('../utils/httpResponse');
const logger = require('../utils/logger');

const PROBLEM_FIELDS = 'title slug difficulty tags';

async function listContests(req, res) {
  try {
    const now = new Date();

    const upcoming = await Contest.find({ status: { $in: ['upcoming', 'active'] } })
      .sort({ startTime: 1 })
      .select('-participants.solvedProblems')
      .populate('problems', PROBLEM_FIELDS)
      .lean();

    const past = await Contest.find({ status: 'completed' })
      .sort({ startTime: -1 })
      .limit(20)
      .select('title slug dayOfWeek startTime endTime status participants')
      .lean();

    const pastSummaries = past.map(c => ({
      _id: c._id,
      title: c.title,
      slug: c.slug,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      participantCount: c.participants.length,
    }));

    return success(res, { now, upcoming, past: pastSummaries });
  } catch (err) {
    logger.error('List contests error:', err.message);
    return fail(res, 500, 'Failed to load contests');
  }
}

async function getContest(req, res) {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug })
      .populate('problems', PROBLEM_FIELDS)
      .populate('participants.user', 'username elo')
      .lean();

    if (!contest) return fail(res, 404, 'Contest not found');

    const leaderboard = [...contest.participants]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.finalRank ?? 999) - (b.finalRank ?? 999);
      })
      .map((p, i) => ({
        rank: p.finalRank ?? i + 1,
        user: p.user,
        score: p.score,
        solvedCount: p.solvedProblems.length,
      }));

    const userId = req.user?.id;
    const myParticipation = userId
      ? contest.participants.find(p => p.user?._id?.toString() === userId.toString())
      : null;

    const myRank = userId
      ? leaderboard.findIndex(e => e.user?._id?.toString() === userId.toString()) + 1
      : 0;

    return success(res, {
      contest: { ...contest, participants: undefined },
      leaderboard,
      myParticipation: myParticipation
        ? {
          score: myParticipation.score,
          solvedProblems: myParticipation.solvedProblems,
          finalRank: myParticipation.finalRank,
          rank: myRank || myParticipation.finalRank || null,
        }
        : null,
    });
  } catch (err) {
    logger.error('Get contest error:', err.message);
    return fail(res, 500, 'Failed to load contest');
  }
}

async function joinContest(req, res) {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug });
    if (!contest) return fail(res, 404, 'Contest not found');
    if (contest.status === 'completed') return fail(res, 400, 'This contest has already ended');

    const userId = req.user.id;
    const alreadyJoined = contest.participants.some(p => p.user.toString() === userId.toString());
    if (!alreadyJoined) {
      contest.participants.push({ user: userId, joinedAt: new Date(), solvedProblems: [], score: 0 });
      await contest.save();
    }

    return success(res, { joined: true }, 'Joined contest');
  } catch (err) {
    logger.error('Join contest error:', err.message);
    return fail(res, 500, 'Failed to join contest');
  }
}

// Called after a problem's tests fully pass while the user is inside an
// active contest (problemSlug must be one of the contest's 4 problems).
async function recordContestSolve(req, res) {
  try {
    const { problemId } = req.body;
    if (!problemId) return fail(res, 400, 'problemId is required');

    const contest = await Contest.findOne({ slug: req.params.slug });
    if (!contest) return fail(res, 404, 'Contest not found');
    if (contest.status !== 'active') return fail(res, 400, 'This contest is not currently active');

    const isContestProblem = contest.problems.some(p => p.toString() === problemId.toString());
    if (!isContestProblem) return fail(res, 400, 'That problem is not part of this contest');

    const userId = req.user.id;
    let participant = contest.participants.find(p => p.user.toString() === userId.toString());
    if (!participant) {
      contest.participants.push({ user: userId, joinedAt: new Date(), solvedProblems: [], score: 0 });
      participant = contest.participants[contest.participants.length - 1];
    }

    const alreadySolved = participant.solvedProblems.some(s => s.problem.toString() === problemId.toString());
    if (alreadySolved) {
      return success(res, { alreadySolved: true, score: participant.score }, 'Already solved');
    }

    const timeTakenSec = Math.max(0, Math.round((Date.now() - contest.startTime.getTime()) / 1000));
    participant.solvedProblems.push({ problem: problemId, solvedAt: new Date(), timeTakenSec });

    // Earlier solves are worth slightly more — rewards fast, decisive solving
    // without needing a separate scoring config.
    const basePoints = 100;
    const speedBonus = Math.max(0, 30 - Math.floor(timeTakenSec / 120));
    participant.score += basePoints + speedBonus;

    await contest.save();

    return success(res, { alreadySolved: false, score: participant.score }, 'Solve recorded');
  } catch (err) {
    logger.error('Record contest solve error:', err.message);
    return fail(res, 500, 'Failed to record solve');
  }
}

async function getContestHistory(req, res) {
  try {
    const userId = req.user.id;
    const contests = await Contest.find({ status: 'completed', 'participants.user': userId })
      .sort({ startTime: -1 })
      .select('title slug dayOfWeek startTime endTime participants')
      .lean();

    const history = contests.map(c => {
      const me = c.participants.find(p => p.user.toString() === userId.toString());
      return {
        _id: c._id,
        title: c.title,
        slug: c.slug,
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        endTime: c.endTime,
        myScore: me?.score ?? 0,
        mySolvedCount: me?.solvedProblems?.length ?? 0,
        myRank: me?.finalRank ?? null,
        totalParticipants: c.participants.length,
      };
    });

    return success(res, history);
  } catch (err) {
    logger.error('Get contest history error:', err.message);
    return fail(res, 500, 'Failed to load contest history');
  }
}

module.exports = { listContests, getContest, joinContest, recordContestSolve, getContestHistory };
