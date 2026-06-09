'use strict';

const mongoose = require('mongoose');

const SnapshotSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: 'javascript',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

SnapshotSchema.index({ sessionId: 1, timestamp: 1 });
SnapshotSchema.index({ roomId: 1, timestamp: 1 });

module.exports = mongoose.model('Snapshot', SnapshotSchema);
