'use strict';

const Rating = require('../models/Rating');
const Session = require('../models/Session');
const User = require('../models/User');
const { ok: success, fail } = require('../utils/httpResponse');
const logger = require('../utils/logger');

async function submitRating(req, res) {
  try {
    const { sessionId, toUserId, score, feedback } = req.body;
    const fromUserId = req.user.id;

    if (!sessionId || !toUserId || !score) {
      return fail(res, 400, 'sessionId, toUserId, and score are required');
    }
    const numScore = parseInt(score, 10);
    if (isNaN(numScore) || numScore < 1 || numScore > 5) {
      return fail(res, 400, 'score must be between 1 and 5');
    }
    if (String(fromUserId) === String(toUserId)) {
      return fail(res, 400, "You can't rate yourself");
    }

    const session = await Session.findById(sessionId).lean();
    if (!session) return fail(res, 404, 'Session not found');
    if (session.status !== 'completed') return fail(res, 400, 'Session must be completed before rating');
    const participantIds = session.participants.map(p => String(p));
    if (!participantIds.includes(String(fromUserId)) || !participantIds.includes(String(toUserId))) {
      return fail(res, 403, 'Both users must be participants in the session');
    }
    const roomId = session.roomId;

    const existing = await Rating.findOne({ fromUser: fromUserId, toUser: toUserId, roomId });
    if (existing) {
      existing.score = numScore;
      existing.feedback = (feedback || '').slice(0, 500);
      await existing.save();
      return success(res, { rating: existing }, 'Rating updated');
    }

    const rating = await Rating.create({
      fromUser: fromUserId,
      toUser: toUserId,
      roomId,
      score: numScore,
      feedback: (feedback || '').slice(0, 500),
    });
    return success(res, { rating }, 'Rating submitted');
  } catch (err) {
    logger.error('submitRating error:', err);
    return fail(res, 500, 'Failed to submit rating');
  }
}

async function getUserRatings(req, res) {
  try {
    const userId = req.params.userId || req.user.id;
    const [ratings, agg] = await Promise.all([
      Rating.find({ toUser: userId })
        .populate('fromUser', 'username')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Rating.aggregate([
        { $match: { toUser: require('mongoose').Types.ObjectId.createFromHexString(String(userId)) } },
        { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
      ]),
    ]);
    return success(res, {
      ratings,
      avgRating: agg?.[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : 0,
      totalRatings: agg?.[0]?.count || 0,
    });
  } catch (err) {
    logger.error('getUserRatings error:', err);
    return fail(res, 500, 'Failed to get ratings');
  }
}

module.exports = { submitRating, getUserRatings };
