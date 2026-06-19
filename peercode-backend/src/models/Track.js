'use strict';

const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    company: {
      type: String,
    },
    description: {
      type: String,
    },
    problems: [
      {
        problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
        order: Number,
        frequencyNote: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    estimatedHours: {
      type: Number,
    },
  },
  { timestamps: true }
);

TrackSchema.index({ 'problems.problem': 1 });
TrackSchema.index({ isActive: 1 });

module.exports = mongoose.model('Track', TrackSchema);
