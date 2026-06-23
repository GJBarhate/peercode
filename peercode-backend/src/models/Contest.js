'use strict';

const mongoose = require('mongoose');

const ContestParticipantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    solvedProblems: [
      {
        problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
        solvedAt: Date,
        // Seconds from contest start to solve — used as a tiebreaker.
        timeTakenSec: Number,
      },
    ],
    score: { type: Number, default: 0 },
    finalRank: { type: Number, default: null },
  },
  { _id: false }
);

const ContestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    dayOfWeek: { type: String, enum: ['sunday', 'wednesday'], required: true },
    problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
      index: true,
    },
    participants: [ContestParticipantSchema],
  },
  { timestamps: true }
);

ContestSchema.index({ startTime: 1 });
ContestSchema.index({ status: 1, startTime: 1 });

module.exports = mongoose.model('Contest', ContestSchema);
