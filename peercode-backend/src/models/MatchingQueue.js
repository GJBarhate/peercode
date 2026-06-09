'use strict';

const mongoose = require('mongoose');

const MatchingQueueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    elo: {
      type: Number,
      default: 1200,
    },
    preferredRole: {
      type: String,
      enum: ['interviewer', 'interviewee', 'observer', 'any'],
      default: 'any',
    },
    preferredTopic: {
      type: String,
      default: 'any',
    },
    socketId: {
      type: String,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

MatchingQueueSchema.index({ joinedAt: 1 });
MatchingQueueSchema.index({ preferredRole: 1, preferredTopic: 1 });

module.exports = mongoose.model('MatchingQueue', MatchingQueueSchema);
