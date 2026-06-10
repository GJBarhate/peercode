'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('../models/Problem');

// Maps slugs to number of function parameters
const PARAM_COUNTS = {
  'two-sum': 2, 'valid-parentheses': 1, 'best-time-to-buy-and-sell-stock': 1,
  'maximum-subarray': 1, 'number-of-islands': 1, 'merge-intervals': 1,
  'coin-change': 2, 'word-break': 2, 'binary-tree-level-order-traversal': 1,
  'lru-cache': 0, 'house-robber': 1, 'longest-substring-without-repeating-characters': 1,
  'container-with-most-water': 1, '3sum': 1, 'course-schedule': 2,
  'trapping-rain-water': 1, 'pacific-atlantic-water-flow': 1, 'decode-ways': 1,
  'rotate-image': 1, 'word-ladder': 3, 'climbing-stairs': 1, 'palindromic-substrings': 1,
  'serialize-and-deserialize-binary-tree': 1,
};

async function fixTestCases() {
  await mongoose.connect(process.env.MONGO_URI);
  const problems = await Problem.find({}).select('slug testCases');
  let fixed = 0;
  
  for (const problem of problems) {
    const paramCount = PARAM_COUNTS[problem.slug];
    if (!paramCount || !problem.testCases?.length) continue;
    
    let changed = false;
    const newTestCases = problem.testCases.map(tc => {
      const raw = tc.input || '';
      
      // Try to parse as JSON
      let parsed;
      try { parsed = JSON.parse(raw); } catch { return tc; }
      
      if (!Array.isArray(parsed)) {
        // Single value (string, number) — wrap in array
        if (paramCount === 1) {
          tc.input = JSON.stringify([parsed]);
          changed = true;
        }
        return tc;
      }
      
      // Already an array
      if (paramCount > 1) {
        // Multi-param: check if it's newline-separated (e.g., "[...]\n...")
        if (raw.includes('\n')) {
          // Convert newline-separated to JSON array
          const parts = raw.split('\n').filter(p => p.trim());
          if (parts.length === paramCount) {
            const jsonParts = parts.map(p => { try { return JSON.parse(p); } catch { return p; } });
            tc.input = JSON.stringify(jsonParts);
            changed = true;
          }
        }
        // If already a JSON array with correct number of top-level elements, keep as-is
        return tc;
      }
      
      // Single param: check if the array IS the argument (2D array) or IS a list of args
      if (paramCount === 1 && parsed.length > 0) {
        // Check if this looks like a 2D array (each element is an array)
        // If so, the outer array IS the argument — wrap it
        const is2D = Array.isArray(parsed[0]);
        // Check if the parsed result has the structure of the expected argument
        // For a single param problem, the input should be [param_value]
        // If parsed is already [value], don't wrap again
        
        // Heuristic: if the problem has 1 param and the input has more than 1 top-level element
        // that are themselves arrays, it's a 2D array being treated as N args
        // Wrap it
        if (parsed.length > 1 || (parsed.length === 1 && !is2D)) {
          // Could be a 2D array ([[...], [...], ...]) being treated as N args
          // Wrap the entire thing as a single argument
          const wasArray = raw.startsWith('[') && raw.endsWith(']');
          if (wasArray) {
            // Don't double-wrap if already in the format [[arg]]
            const inner = parsed;
            const alreadyWrapped = inner.length === 1 && Array.isArray(inner[0]) && Array.isArray(inner[0][0]);
            if (!alreadyWrapped) {
              tc.input = JSON.stringify([parsed]);
              changed = true;
            }
          }
        }
      }
      
      return tc;
    });
    
    if (changed) {
      problem.testCases = newTestCases;
      await problem.save();
      fixed++;
    }
  }
  
  console.log(`Fixed ${fixed} problems`);
  await mongoose.disconnect();
}

fixTestCases().catch(e => { console.error(e); process.exit(1); });
