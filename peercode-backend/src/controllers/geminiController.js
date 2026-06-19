'use strict';

const { callGemini } = require('../config/gemini');
const { fail, ok: success } = require('../utils/httpResponse');
const logger = require('../utils/logger');
const { canUseFeature, incrementUsage, getUsageInfo } = require('../utils/subscription');

async function checkUsageAndCall(req, res, feature, promptBuilder) {
  const user = req.user;
  if (!user) return fail(res, 401, 'Unauthorized');

  const userApiKey = req.headers['x-gemini-key'] || (user.apiKey || null);
  const useOwnKey = !!userApiKey;

  if (!useOwnKey) {
    const check = canUseFeature(user, feature);
    if (!check.allowed) {
      const usageInfo = getUsageInfo(user);
      return fail(res, 403, `Monthly ${feature} limit reached`, { 
        upgradeRequired: true, 
        usage: usageInfo,
        feature 
      });
    }
  }

  try {
    const prompt = promptBuilder(req.body);
    const result = await callGemini(prompt, userApiKey);
    
    if (!result) {
      return fail(res, 502, `Failed to ${feature === 'hints' ? 'generate hint' : 'analyze code'}. Please try again.`);
    }

    if (!useOwnKey) {
      await incrementUsage(user, feature);
    }

    return { result, useOwnKey, unlimited: useOwnKey };
  } catch (err) {
    logger.error(`Gemini ${feature} error:`, err);
    // Preserve error type for differentiation upstream
    if (err.message?.includes('429') || err.status === 429 || err.message?.includes('quota')) {
      err._rateLimit = true;
    } else if (err.message?.includes('key') || err.message?.includes('API_KEY')) {
      err._keyError = true;
    }
    throw err;
  }
}

async function getHint(req, res) {
  const { code, problem, language } = req.body;

  if (!problem) {
    return fail(res, 400, 'problem is required');
  }

  const promptBuilder = (body) => `You are an expert coding interview coach. A candidate is working on the following problem:

Problem: ${body.problem}
Language: ${body.language || 'not specified'}
Current Code:
${body.code || '(no code yet)'}

Please provide a detailed and helpful hint that guides them toward the solution without giving away the complete answer. Focus on:
1. Key approach or algorithm to consider
2. Important data structures or patterns
3. Edge cases to think about
4. Specific step-by-step guidance

Be thorough and helpful - provide multiple paragraphs if needed to give real value.`;

  try {
    const outcome = await checkUsageAndCall(req, res, 'hints', promptBuilder);
    if (!outcome) return; // response already sent (rate-limit / auth failure)
    const { result: hint, unlimited } = outcome;
    const usageInfo = getUsageInfo(req.user);
    res.json({ hint, usage: usageInfo, unlimited });
  } catch (err) {
    if (err._rateLimit) {
      return fail(res, 429, 'Gemini quota exceeded. Use your own API key in Settings > Gemini Key, or wait for quota to reset.');
    }
    if (err._keyError) {
      return fail(res, 502, 'Gemini API key invalid. Go to https://aistudio.google.com/apikey to get a valid key, or add your own key in Settings > Gemini Key.');
    }
    return fail(res, 502, 'Failed to get hint. Please try again.');
  }
}

async function analyzeCode(req, res) {
  const { code, language, problem } = req.body;

  if (!code) {
    return fail(res, 400, 'code is required');
  }
  if (code.length > 10_000) {
    return fail(res, 400, 'Code exceeds 10KB limit for analysis');
  }

  const promptBuilder = (body) => `You are an expert software engineer and code reviewer. A candidate is solving the following problem:

Problem: ${body.problem || 'No problem description provided'}
Language: ${body.language || 'not specified'}

Please provide detailed and structured feedback on their code. Include:

**Time Complexity:** [provide the Big O notation]

**Space Complexity:** [provide the Big O notation]

**Issues Found:**
- [list each issue separately]

**Feedback:** [detailed constructive feedback on the approach and implementation]

**Improvements:** [list 3-5 specific improvements they could make]

Code to analyze:
${body.code}

Be thorough and helpful. Explain WHY each issue matters and HOW to fix it.`;

  try {
    const outcome = await checkUsageAndCall(req, res, 'analyzes', promptBuilder);
    if (!outcome) return; // response already sent
    const { result: analysis, unlimited } = outcome;
    
    const sections = {
      timeComplexity: '',
      spaceComplexity: '',
      feedback: analysis,
      suggestions: []
    };

    const timeMatch = analysis.match(/\*\*Time Complexity[:\*]+\s*([^\n*]+)/i);
    if (timeMatch) sections.timeComplexity = timeMatch[1].trim();

    const spaceMatch = analysis.match(/\*\*Space Complexity[:\*]+\s*([^\n*]+)/i);
    if (spaceMatch) sections.spaceComplexity = spaceMatch[1].trim();

    const usageInfo = getUsageInfo(req.user);
    res.json({ ...sections, usage: usageInfo, unlimited });
  } catch (err) {
    if (err._rateLimit) {
      return fail(res, 429, 'Gemini quota exceeded. Use your own API key in Settings > Gemini Key, or wait for quota to reset.');
    }
    if (err._keyError) {
      return fail(res, 502, 'Gemini API key invalid. Go to https://aistudio.google.com/apikey to get a valid key, or add your own key in Settings > Gemini Key.');
    }
    return fail(res, 502, 'Failed to analyze code. Please try again.');
  }
}

async function generateQuestion(req, res) {
  const { difficulty, topic } = req.body;
  const user = req.user;

  if (!difficulty || !topic) {
    return fail(res, 400, 'difficulty and topic are required');
  }

  if (!user) return fail(res, 401, 'Unauthorized');

  const userApiKey = req.headers['x-gemini-key'] || (user.apiKey || null);
  const useOwnKey = !!userApiKey;

  if (!useOwnKey) {
    const check = canUseFeature(user, 'questions');
    if (!check.allowed) {
      const usageInfo = getUsageInfo(user);
      return fail(res, 403, 'Monthly limit reached', { upgradeRequired: true, usage: usageInfo });
    }
  }

  const prompt = `Generate a ${difficulty} difficulty DSA (Data Structures and Algorithms) coding interview problem on the topic of "${topic}".

Include:
1. A clear problem title
2. Problem description with constraints
3. 2 examples with input, output, and explanation
4. Hints (without full solution)
5. Expected time and space complexity

Format the problem as a coding interview question similar to LeetCode style.`;

  try {
    const question = await callGemini(prompt, userApiKey);
    if (!useOwnKey) await incrementUsage(user, 'questions');
    const usageInfo = getUsageInfo(req.user);
    res.json({ question, usage: usageInfo, unlimited: useOwnKey });
  } catch (err) {
    logger.error('Gemini question error:', err);
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return fail(res, 429, 'Gemini quota exceeded. Use your own API key in Settings > Gemini Key.');
    }
    return fail(res, 502, 'Failed to generate question. Please try again.');
  }
}

async function getUsage(req, res) {
  const user = req.user;
  if (!user) return fail(res, 401, 'Unauthorized');
  
  const usageInfo = getUsageInfo(user);
  return success(res, usageInfo);
}

module.exports = { getHint, analyzeCode, generateQuestion, getUsage };
