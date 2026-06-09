'use strict';

const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
    },
    problemSnapshot: {
      title: String,
      difficulty: String,
      slug: String,
      tags: [String],
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    snapshots: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Snapshot',
      },
    ],
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    isRecording: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },
    finalCode: String,
    finalLanguage: String,
    testResults: {
      passed: Number,
      total: Number,
      allPassed: Boolean,
    },
    eloAtStart: Number,
    eloAtEnd: Number,
    eloDelta: Number,
    eloData: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, eloAtEnd: Number, delta: Number }],
    debrief: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiDebrief',
    },
  },
  { timestamps: true }
);

SessionSchema.index({ roomId: 1, startTime: -1 });
SessionSchema.index({ participants: 1 });
SessionSchema.index({ problem: 1 });
SessionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Session', SessionSchema);
