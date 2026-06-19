'use strict';

const mongoose = require('mongoose');

const SolutionSchema = new mongoose.Schema({
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  explanation: { type: String, default: '' },
  upvotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

SolutionSchema.index({ problem: 1, createdAt: -1 });
SolutionSchema.index({ user: 1 });
SolutionSchema.index({ problem: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Solution', SolutionSchema);
