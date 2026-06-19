'use strict';

const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    companies: [String],
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    hiddenTests: {
      type: [
        {
          input: String,
          expectedOutput: String,
        },
      ],
      select: false,
    },
    tags: [String],
    constraints: String,
    timeLimit: {
      type: Number,
      default: 2000,
    },
    memoryLimit: {
      type: Number,
      default: 256,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    acceptanceRate: {
      type: Number,
      default: 0,
    },
    stubs: {
      javascript: String,
      typescript: String,
      python: String,
      java: String,
      cpp: String,
      go: String,
    },
    testCases: [
      {
        input: String,
        expectedOutput: String,
      },
    ],
    starterCode: {
      javascript: String,
      typescript: String,
      python: String,
      java: String,
      cpp: String,
      go: String,
    },
    codeTemplates: {
      javascript: String,
      typescript: String,
      python: String,
      java: String,
      cpp: String,
      go: String,
    },
    testHarness: {
      javascript: String,
      typescript: String,
      python: String,
      java: String,
      cpp: String,
      go: String,
    },
    hints: [String],
    editorial: {
      type: String,
      default: '',
    },
    solutions: {
      type: {
        javascript: String,
        typescript: String,
        python: String,
        java: String,
        cpp: String,
        go: String,
      },
      select: false,
    },
  },
  { timestamps: true }
);

ProblemSchema.index({ difficulty: 1 });
ProblemSchema.index({ tags: 1 });
ProblemSchema.index({ companies: 1 });
ProblemSchema.index({ difficulty: 1, isActive: 1 });

module.exports = mongoose.model('Problem', ProblemSchema);
