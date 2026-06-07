'use strict';

const Rating = require('../../models/Rating');
const User = require('../../models/User');
const { eloCalculator } = require('../../utils/eloCalculator');

module.exports = function defineRatingUpdateJob(agenda) {
  agenda.define('rating-update', async (job) => {
    const { roomId, participantIds } = job.attrs.data;

    if (!participantIds || participantIds.length < 2) return;

    const [idA, idB] = participantIds;

    const [userA, userB] = await Promise.all([
      User.findById(idA),
      User.findById(idB),
    ]);

    if (!userA || !userB) return;

    const ratingsForA = await Rating.find({ roomId, toUser: idA });
    const ratingsForB = await Rating.find({ roomId, toUser: idB });

    const avgScore = (ratings) => {
      if (!ratings.length) return 3;
      return ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
    };

    const scoreA = avgScore(ratingsForA) / 5;
    const scoreB = avgScore(ratingsForB) / 5;

    const { newEloA, newEloB } = eloCalculator(userA.elo, userB.elo, scoreA, scoreB);

    await Promise.all([
      User.updateOne({ _id: idA }, { $set: { elo: Math.max(0, newEloA) } }),
      User.updateOne({ _id: idB }, { $set: { elo: Math.max(0, newEloB) } }),
    ]);
  });
};
