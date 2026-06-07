'use strict';

const mongoose = require('mongoose');

const UserTrackProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    track: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    completedProblems: [
      {
        problem: mongoose.Schema.Types.ObjectId,
        completedAt: Date,
        sessionId: String,
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

UserTrackProgressSchema.index({ user: 1, track: 1 }, { unique: true });

module.exports = mongoose.model('UserTrackProgress', UserTrackProgressSchema);
