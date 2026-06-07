'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('../models/Problem');

async function addTestCases() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const additionalTestCases = {
    'maximum-subarray': [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
      { input: '[1]', expectedOutput: '1' },
      { input: '[5,4,-1,7,8]', expectedOutput: '23' },
      { input: '[-1,-2,-3,-4]', expectedOutput: '-1' }
    ],
    'number-of-islands': [
      { input: '["1","1","1","1","0"]\n["1","1","0","1","0"]\n["1","1","0","0","0"]\n["0","0","0","0","0"]', expectedOutput: '1' },
      { input: '["1","1","0","0","0"]\n["1","1","0","0","0"]\n["0","0","1","0","0"]\n["0","0","0","1","1"]', expectedOutput: '3' },
      { input: '["1"]', expectedOutput: '1' },
      { input: '["0"]', expectedOutput: '0' }
    ],
    'lru-cache': [
      { input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', expectedOutput: '[null,null,null,1,null,-1,null,-1,3,4]' },
      { input: '["LRUCache","put","get"]\n[[1],[2,1],[2]]', expectedOutput: '[null,null,1]' }
    ],
    'word-break': [
      { input: 'leetcode\nleet,code', expectedOutput: 'true' },
      { input: 'applepenapple\napple,pen', expectedOutput: 'true' },
      { input: 'catsandog\ncats,dog,sand,and,cat', expectedOutput: 'false' },
      { input: 'a\na', expectedOutput: 'true' }
    ],
    'merge-intervals': [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]' },
      { input: '[[1,4],[2,3]]', expectedOutput: '[[1,4]]' },
      { input: '[[1,4],[0,4]]', expectedOutput: '[[0,4]]' }
    ],
    'binary-tree-level-order-traversal': [
      { input: '[3,9,20,null,null,15,7]', expectedOutput: '[[3],[9,20],[15,7]]' },
      { input: '[1]', expectedOutput: '[[1]]' },
      { input: '[]', expectedOutput: '[]' },
      { input: '[1,2,3,4,5]', expectedOutput: '[[1],[2,3],[4,5]]' }
    ],
    'coin-change': [
      { input: '[1,5,11,25]\n36', expectedOutput: '2' },
      { input: '[1,2,5]\n11', expectedOutput: '3' },
      { input: '[2]\n3', expectedOutput: '-1' },
      { input: '[1]\n0', expectedOutput: '0' }
    ]
  };
  
  for (const [slug, testCases] of Object.entries(additionalTestCases)) {
    const problem = await Problem.findOne({ slug });
    if (problem && (!problem.testCases || problem.testCases.length === 0)) {
      problem.testCases = testCases;
      await problem.save();
      console.log(`Added ${testCases.length} test cases to ${slug}`);
    } else if (problem) {
      console.log(`${slug} already has ${problem.testCases.length} test cases`);
    }
  }
  
  await mongoose.disconnect();
}

addTestCases().catch(console.error);