'use strict';

const mongoose = require('mongoose');

const AiDebriefSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
  generatedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scores: {
    communication: { type: Number, min: 1, max: 5 },
    decomposition: { type: Number, min: 1, max: 5 },
    codeQuality: { type: Number, min: 1, max: 5 },
    complexity: { type: Number, min: 1, max: 5 },
  },
  overallReadiness: {
    type: Number,
    min: 1,
    max: 10,
  },
  whatWentWell: [String],
  areasToImprove: [String],
  studyNext: [String],
  weakTopics: [String],
  summary: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

AiDebriefSchema.index({ roomId: 1, generatedFor: 1 });

module.exports = mongoose.model('AiDebrief', AiDebriefSchema);
