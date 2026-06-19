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
  problemTitle: String,
  problemDifficulty: String,
  problemSlug: String,
  sessionDate: Date,
  duration: Number,
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
  // Structured deep analysis (FEATURE-008)
  overallScore: { type: Number, min: 0, max: 100 },
  timeComplexity: String,
  spaceComplexity: String,
  approachAnalysis: String,
  interviewerPerspective: String,
  improvementPlan: [String],
  similarProblems: [{ title: String, difficulty: String, reason: String }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

AiDebriefSchema.index({ roomId: 1, generatedFor: 1 });
AiDebriefSchema.index({ generatedFor: 1, createdAt: -1 });
AiDebriefSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('AiDebrief', AiDebriefSchema);
