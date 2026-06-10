'use strict';

const axios = require('axios');
const { fail } = require('../utils/httpResponse');
const logger = require('../utils/logger');
const Problem = require('../models/Problem');
const { getLanguageId, extractFunctionName, wrapCodeForTest, buildCodeFromHarness } = require('../utils/executeHelpers');

const JUDGE0_URL = 'https://ce.judge0.com/submissions';

function normalizeOutput(output) {
  const trimmed = (output || '').trim();
  try { return JSON.stringify(JSON.parse(trimmed)); }
  catch (_) { return trimmed.replace(/\s+/g, ' ').trim(); }
}

function normalizeArrayOutput(s) {
  const trimmed = (s || '').trim();
  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed);
  } catch (_) {
    return trimmed.replace(/\s+/g, ' ').trim();
  }
}

function outputsMatch(actual, expected) {
  const a = (actual || '').trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const e = (expected || '').trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (a === e) return true;
  try { return normalizeOutput(a) === normalizeOutput(e); } catch (_) {}
  try { return normalizeArrayOutput(a) === normalizeArrayOutput(e); } catch (_) {}
  try {
    const pa = JSON.parse(a);
    const pe = JSON.parse(e);
    if (Array.isArray(pa) && Array.isArray(pe)) {
      return JSON.stringify(pa) === JSON.stringify(pe);
    }
  } catch (_) {}
  return a.replace(/\s+/g, '') === e.replace(/\s+/g, '');
}

async function executeWithRetry(url, data, retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios.post(url, data, { timeout: 15000, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      lastError = e;
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        if (attempt < retries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          logger.info(`Judge0 timeout (attempt ${attempt}/${retries}), retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      } else if (e.response?.status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

async function simpleExecute(req, res) {
  try {
    const { code, language, stdin } = req.body;
    if (!code?.trim()) return fail(res, 400, 'Code is required');
    if (!language) return fail(res, 400, 'Language is required');
    let languageId; try { languageId = getLanguageId(language); } catch (e) { return fail(res, 400, e.message); }
    logger.info(`Simple execute: ${language} (ID: ${languageId})`);
    const response = await executeWithRetry(`${JUDGE0_URL}?wait=true&base64_encoded=false`, {
      source_code: code, language_id: languageId, stdin: stdin || '', cpu_time_limit: 5, memory_limit: 131072
    });
    const executionTime = response.data.time ? parseFloat(response.data.time) * 1000 : 0;
    const output = (response.data.stdout || '').trim();
    const statusId = response.data.status?.id;
    const status = response.data.status?.description || 'Unknown';
    let error = null;
    if (statusId === 6) error = response.data.compile_output || 'Compilation Error';
    else if (statusId === 11) error = response.data.stderr || 'Runtime Error';
    else if (statusId === 5) error = 'Time Limit Exceeded';
    else if (response.data.stderr) error = response.data.stderr;
    res.json({ output, error, statusId, status, time: response.data.time || '0', memory: response.data.memory ? Math.round(response.data.memory / 1024) : 0 });
  } catch (e) { logger.error('Simple execution error:', e.message); fail(res, 500, 'Execution service unavailable. Try again.'); }
}

async function executeCode(req, res) {
  try {
    const { code, language, testCases, stdin, problemId, problemSlug } = req.body;
    if (!code?.trim()) return fail(res, 400, 'Code is required');
    if (!language) return fail(res, 400, 'Language is required');
    let languageId; try { languageId = getLanguageId(language); } catch (e) { return fail(res, 400, e.message); }
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      if (stdin !== undefined || req.body.customInput !== undefined) {
        req.body.stdin = stdin || req.body.customInput || '';
        return simpleExecute(req, res);
      }
      return fail(res, 400, 'At least one test case is required');
    }
    for (const tc of testCases) if (tc.input === undefined || tc.expectedOutput === undefined) return fail(res, 400, 'Each test case must have input and expectedOutput');

    let problem = null;
    try {
      if (problemId) problem = await Problem.findById(problemId).select('starterCode testHarness');
      else if (problemSlug) problem = await Problem.findOne({ slug: problemSlug }).select('starterCode testHarness');
    } catch (e) { logger.warn('Could not fetch problem:', e.message); }

    const harness = problem?.testHarness?.[language];
    const hasHarness = !!harness;

    let functionName = null;
    try {
      if (problem?.starterCode) {
        functionName = extractFunctionName(problem.starterCode, language);
      }
    } catch (e) { logger.warn('Could not extract function name:', e.message); }
    const hasSolutionClass = code.includes('class Solution');
    if (!functionName && problemSlug) {
      const KNOWN_FUNCTIONS = {
        'valid-parentheses': 'isValid',
        'best-time-to-buy-and-sell-stock': 'maxProfit',
        'maximum-subarray': 'maxSubArray',
        'number-of-islands': 'numIslands',
        'merge-intervals': 'merge',
        'coin-change': 'coinChange',
        'word-break': 'wordBreak',
        'binary-tree-level-order-traversal': 'levelOrder',
        'lru-cache': 'LRUCache',
        'house-robber': 'rob',
        'longest-substring-without-repeating-characters': 'lengthOfLongestSubstring',
        'container-with-most-water': 'maxArea',
        '3sum': 'threeSum',
        'serialize-and-deserialize-binary-tree': 'serialize',
        'climbing-stairs': 'climbStairs',
        'palindromic-substrings': 'countSubstrings',
        'course-schedule': 'canFinish',
        'trapping-rain-water': 'trap',
        'pacific-atlantic-water-flow': 'pacificAtlantic',
        'decode-ways': 'numDecodings',
        'rotate-image': 'rotate',
        'word-ladder': 'ladderLength',
      };
      functionName = KNOWN_FUNCTIONS[problemSlug] || problemSlug.split('-').map((p,i)=>i===0?p:p[0].toUpperCase()+p.slice(1)).join('');
    }

    // Parameter count per problem for correct test case input wrapping
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
    const paramCount = PARAM_COUNTS[problemSlug] || 1;
    if (!functionName) functionName = 'solution';

    logger.info(`Executing ${hasHarness ? 'with harness' : 'with generic wrapper'} for ${language} (ID: ${languageId}), ${testCases.length} test cases`);

    // Normalize test inputs: ensure JSON array of arguments format
    for (const tc of testCases) {
      let input = (tc.input || '').trim();
      // Try to fix common format: raw value -> JSON array of arguments
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed) && paramCount === 1 && parsed.length > 0) {
          // Check if this looks like a 2D array being treated as N arguments
          // e.g., [["1","1"],["1","0"]] for numIslands(grid) where grid is 1 param
          // If parsed[0] is an array, the outer array is the argument itself
          // Wrap it: [[["1","1"],["1","0"]]] -> 1 argument = the grid
          if (Array.isArray(parsed[0]) || parsed.length > 1) {
            tc.input = JSON.stringify([parsed]);
          }
        }
      } catch (_) {
        // Not JSON — check if newline-separated and convert to JSON array
        if (input.includes('\n') && paramCount > 1) {
          const parts = input.split('\n').filter(p => p.trim());
          if (parts.length === paramCount) {
            try {
              const jsonParts = parts.map(p => JSON.parse(p));
              tc.input = JSON.stringify(jsonParts);
            } catch (_2) {}
          }
        }
      }
    }

    const results = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const testInput = tc.input || '';

      let sourceCode, stdinToSend;
      if (hasHarness) {
        sourceCode = buildCodeFromHarness(problem, language, code, testInput);
        stdinToSend = '';
      } else {
        sourceCode = wrapCodeForTest(code, language, functionName, hasSolutionClass);
        stdinToSend = testInput;
      }

      try {
        const startTime = Date.now();
        const response = await executeWithRetry(`${JUDGE0_URL}?wait=true&base64_encoded=false`, {
          source_code: sourceCode, language_id: languageId, stdin: stdinToSend, cpu_time_limit: 5, memory_limit: 131072
        });
        const executionTime = Date.now() - startTime;
        const actualOutput = (response.data.stdout || '').trim();
        const expectedOutput = (tc.expectedOutput || '').trim();
        const passed = outputsMatch(actualOutput, expectedOutput);
        const statusId = response.data.status?.id;
        const statusDesc = response.data.status?.description || 'Unknown';
        let error = null;
        if (statusId === 6) error = response.data.compile_output || 'Compilation Error';
        else if (statusId === 11) error = response.data.runtime_error || 'Runtime Error';
        else if (statusId === 5) error = 'Time Limit Exceeded';
        else if (response.data.stderr) error = response.data.stderr;
        results.push({ index: i, input: tc.input, expectedOutput: tc.expectedOutput, actualOutput, passed, executionTime, time: response.data.time || (executionTime/1000).toFixed(3), memory: response.data.memory ? Math.round(response.data.memory/1024) : 0, status: statusDesc, statusId, error });
      } catch (e) {
        logger.error(`Test ${i} execution error:`, e.message);
        results.push({ index: i, input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: '', passed: false, executionTime: 0, time: '0', memory: 0, status: 'Error', error: e.message || 'Execution service unavailable' });
      }
    }
    const passedCount = results.filter(r => r.passed).length;
    res.json({ results, allPassed: passedCount === results.length && results.length > 0, passedCount, totalCount: results.length, language });
  } catch (e) { logger.error('Code execution error:', e.message); fail(res, 500, 'Failed to execute code. Service may be temporarily unavailable.'); }
}

async function getProblemTestCases(req, res) {
  try {
    const { problemId } = req.params;
    const problem = await Problem.findById(problemId);
    if (!problem) return fail(res, 404, 'Problem not found');
    res.json({ testCases: problem.testCases || [] });
  } catch (e) { logger.error('Get test cases error:', e); fail(res, 500, 'Failed to fetch test cases'); }
}

async function addTestCase(req, res) {
  try {
    const { problemId } = req.params;
    const { input, expectedOutput, isHidden } = req.body;
    if (req.user?.role !== 'admin') return fail(res, 403, 'Only admins can add test cases');
    if (!input || !expectedOutput) return fail(res, 400, 'input and expectedOutput are required');
    const problem = await Problem.findById(problemId);
    if (!problem) return fail(res, 404, 'Problem not found');
    problem.testCases = problem.testCases || [];
    problem.testCases.push({ input, expectedOutput, isHidden: isHidden || false });
    await problem.save();
    res.json({ message: 'Test case added', testCases: problem.testCases });
  } catch (e) { logger.error('Add test case error:', e); fail(res, 500, 'Failed to add test case'); }
}

async function deleteTestCase(req, res) {
  try {
    const { problemId, tcId } = req.params;
    if (req.user?.role !== 'admin') return fail(res, 403, 'Only admins can delete test cases');
    const problem = await Problem.findById(problemId);
    if (!problem) return fail(res, 404, 'Problem not found');
    problem.testCases = (problem.testCases || []).filter(tc => tc._id?.toString() !== tcId);
    await problem.save();
    res.json({ message: 'Test case deleted', testCases: problem.testCases });
  } catch (e) { logger.error('Delete test case error:', e); fail(res, 500, 'Failed to delete test case'); }
}

module.exports = { executeCode, simpleExecute, getProblemTestCases, addTestCase, deleteTestCase };