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

module.exports = mongoose.model('Solution', SolutionSchema);
