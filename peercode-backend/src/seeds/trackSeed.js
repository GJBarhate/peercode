'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const Track = require('../models/Track');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const slugToId = async (slug) => {
      const p = await Problem.findOne({ slug });
      if (!p) throw new Error(`Problem not found: ${slug}`);
      return p._id;
    };

    const tracks = [
      {
        name: 'Amazon SDE-1 Essentials',
        slug: 'amazon-sde1',
        company: 'Amazon',
        description:
          'A curated set of problems frequently asked in Amazon SDE-1 interviews. Covers arrays, graphs, DP, and trees.',
        estimatedHours: 12,
        problemSlugs: [
          'two-sum',
          'best-time-to-buy-and-sell-stock',
          'maximum-subarray',
          'number-of-islands',
          'merge-intervals',
          'coin-change',
          'word-break',
          'binary-tree-level-order-traversal',
        ],
      },
      {
        name: 'Google L4 Fundamentals',
        slug: 'google-l4',
        company: 'Google',
        description:
          'Core problems aligned with Google L4 SWE interviews. Strong emphasis on DP, graph algorithms, and system design thinking.',
        estimatedHours: 14,
        problemSlugs: [
          'two-sum',
          'maximum-subarray',
          'number-of-islands',
          'lru-cache',
          'word-break',
          'merge-intervals',
          'coin-change',
          'valid-parentheses',
        ],
      },
      {
        name: 'Dynamic Programming Deep Dive',
        slug: 'dp-mastery',
        company: null,
        description:
          'Master dynamic programming from easy greedy problems all the way to classic DP patterns.',
        estimatedHours: 8,
        problemSlugs: [
          'best-time-to-buy-and-sell-stock',
          'maximum-subarray',
          'word-break',
          'coin-change',
        ],
      },
      {
        name: 'Interview Ready Foundations',
        slug: 'foundations',
        company: null,
        description:
          'Start here if you are new to coding interviews. Covers the most essential patterns across arrays, stacks, DP, and trees.',
        estimatedHours: 10,
        problemSlugs: [
          'two-sum',
          'valid-parentheses',
          'best-time-to-buy-and-sell-stock',
          'maximum-subarray',
          'merge-intervals',
          'binary-tree-level-order-traversal',
        ],
      },
    ];

    for (const trackData of tracks) {
      const { problemSlugs, ...trackFields } = trackData;

      const problems = [];
      for (let i = 0; i < problemSlugs.length; i++) {
        const problemId = await slugToId(problemSlugs[i]);
        problems.push({ problem: problemId, order: i + 1, frequencyNote: '' });
      }

      await Track.findOneAndUpdate(
        { slug: trackFields.slug },
        { $set: { ...trackFields, problems } },
        { upsert: true, new: true, runValidators: true }
      );

      console.log(`Upserted track: ${trackFields.name}`);
    }

    console.log('Track seed complete.');
  } catch (err) {
    console.error('Track seed error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
