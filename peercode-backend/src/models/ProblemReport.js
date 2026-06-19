'use strict';

const mongoose = require('mongoose');

const ProblemReportSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['wrong-answer', 'broken-testcase', 'unclear-description', 'other'],
    required: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ProblemReportSchema.index({ resolved: 1, createdAt: -1 });
ProblemReportSchema.index({ problem: 1, reportedBy: 1 }, { unique: true });

module.exports = mongoose.model('ProblemReport', ProblemReportSchema);
