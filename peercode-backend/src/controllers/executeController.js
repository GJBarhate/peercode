'use strict';

const axios = require('axios');
const { fail } = require('../utils/httpResponse');
const logger = require('../utils/logger');
const Problem = require('../models/Problem');
const { getLanguageId, extractFunctionName, wrapCodeForTest } = require('../utils/executeHelpers');

const JUDGE0_URL = 'https://ce.judge0.com/submissions';

function normalizeOutput(output) {
  const trimmed = (output || '').trim();
  try { return JSON.stringify(JSON.parse(trimmed)); }
  catch (_) { return trimmed.replace(/\s+/g, ' ').trim(); }
}

function outputsMatch(actual, expected) {
  const a = (actual || '').trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const e = (expected || '').trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (a === e) return true;
  try { return normalizeOutput(a) === normalizeOutput(e); }
  catch (_) { return a.replace(/\s+/g, '') === e.replace(/\s+/g, ''); }
}

async function simpleExecute(req, res) {
  try {
    const { code, language, stdin } = req.body;
    if (!code?.trim()) return fail(res, 400, 'Code is required');
    if (!language) return fail(res, 400, 'Language is required');
    let languageId; try { languageId = getLanguageId(language); } catch (e) { return fail(res, 400, e.message); }
    logger.info(`Simple execute: ${language} (ID: ${languageId})`);
    let response;
    try {
      response = await axios.post(`${JUDGE0_URL}?wait=true&base64_encoded=false`, {
        source_code: code, language_id: languageId, stdin: stdin || '', cpu_time_limit: 5, memory_limit: 131072
      }, { timeout: 15000, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        logger.info('Judge0 timeout, retrying...');
        await new Promise(r => setTimeout(r, 3000));
        response = await axios.post(`${JUDGE0_URL}?wait=true&base64_encoded=false`, {
          source_code: code, language_id: languageId, stdin: stdin || '', cpu_time_limit: 5, memory_limit: 131072
        }, { timeout: 15000, headers: { 'Content-Type': 'application/json' } });
      } else throw e;
    }
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

    let functionName = null;
    try {
      let problem = null;
      if (problemId) problem = await Problem.findById(problemId).select('starterCode');
      else if (problemSlug) problem = await Problem.findOne({ slug: problemSlug }).select('starterCode');
      if (problem?.starterCode) {
        functionName = extractFunctionName(problem.starterCode, language);
      }
    } catch (e) { logger.warn('Could not fetch problem for function name:', e.message); }
    const hasSolutionClass = code.includes('class Solution');
    if (!functionName && problemSlug) functionName = problemSlug.split('-').map((p,i)=>i===0?p:p[0].toUpperCase()+p.slice(1)).join('');
    if (!functionName) functionName = 'solution';

    logger.info(`Executing code with Judge0 for ${language} (ID: ${languageId}) with ${testCases.length} test cases, function: ${functionName}`);

    const results = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const wrappedCode = wrapCodeForTest(code, language, functionName, hasSolutionClass);
      const testInput = tc.input || '';
      try {
        const startTime = Date.now();
        const response = await axios.post(`${JUDGE0_URL}?wait=true&base64_encoded=false`, {
          source_code: wrappedCode, language_id: languageId, stdin: testInput, cpu_time_limit: 5, memory_limit: 131072
        }, { timeout: 15000, headers: { 'Content-Type': 'application/json' } });
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