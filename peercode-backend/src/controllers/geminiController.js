'use strict';

const { callGemini } = require('../config/gemini');
const { fail, ok: success } = require('../utils/httpResponse');
const logger = require('../utils/logger');
const { canUseFeature, incrementUsage, getUsageInfo } = require('../utils/subscription');

function classifyGeminiError(err) {
  if (err.status === 429 || err.message?.includes('429') || err.message?.includes('quota')) return 'quota_exceeded';
  if (err._authError || err.message?.includes('key') || err.message?.includes('API_KEY')) return 'invalid_key';
  return 'unknown';
}

// Tries the user's personal API key first (used exclusively, no pool mixing).
// Only on failure does it fall back to PeerCode's shared key pool — and only
// if the user still has site-quota remaining. The caller is told whether a
// fallback happened so the frontend can notify the user.
// Sends an error response and returns null, signaling to callers
// that they must NOT write a second response (fail()/ok() return the
// truthy Express response object, so callers can't rely on its return
// value to detect "already responded" — they must check for `null`).
async function checkUsageAndCall(req, res, feature, promptBuilder) {
  const user = req.user;
  if (!user) { fail(res, 401, 'Unauthorized'); return null; }

  const userApiKey = req.headers['x-gemini-key'] || (user.apiKey || null);
  const prompt = promptBuilder(req.body);

  let result;
  let usedFallback = false;
  let fallbackReason = null;

  if (userApiKey) {
    try {
      result = await callGemini(prompt, userApiKey);
    } catch (ownKeyErr) {
      fallbackReason = classifyGeminiError(ownKeyErr);
      logger.warn(`Gemini ${feature}: user's own key failed (${fallbackReason}), attempting site fallback`);

      const check = canUseFeature(user, feature);
      if (!check.allowed) {
        const usageInfo = getUsageInfo(user);
        const reasonText = fallbackReason === 'quota_exceeded'
          ? 'Your Gemini API key has reached its quota'
          : 'Your Gemini API key is invalid';
        fail(res, 403, `${reasonText}, and your monthly ${feature} limit on PeerCode's shared key is also reached. Please upgrade or wait for your key's quota to reset.`, {
          upgradeRequired: true,
          usage: usageInfo,
          feature,
          ownKeyFailed: true,
          fallbackReason,
        });
        return null;
      }

      try {
        result = await callGemini(prompt, null);
        usedFallback = true;
        await incrementUsage(user, feature);
      } catch (poolErr) {
        logger.error(`Gemini ${feature} error (after own-key fallback):`, poolErr);
        const finalErr = poolErr;
        finalErr._rateLimit = classifyGeminiError(poolErr) === 'quota_exceeded';
        finalErr._keyError = classifyGeminiError(poolErr) === 'invalid_key';
        throw finalErr;
      }
    }
  } else {
    const check = canUseFeature(user, feature);
    if (!check.allowed) {
      const usageInfo = getUsageInfo(user);
      fail(res, 403, `Monthly ${feature} limit reached`, {
        upgradeRequired: true,
        usage: usageInfo,
        feature
      });
      return null;
    }
    try {
      result = await callGemini(prompt, null);
      await incrementUsage(user, feature);
    } catch (err) {
      logger.error(`Gemini ${feature} error:`, err);
      err._rateLimit = classifyGeminiError(err) === 'quota_exceeded';
      err._keyError = classifyGeminiError(err) === 'invalid_key';
      throw err;
    }
  }

  if (!result) {
    fail(res, 502, `Failed to ${feature === 'hints' ? 'generate hint' : 'analyze code'}. Please try again.`);
    return null;
  }

  return { result, useOwnKey: !!userApiKey, unlimited: !!userApiKey && !usedFallback, usedFallback, fallbackReason };
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
    const { result: hint, unlimited, usedFallback, fallbackReason } = outcome;
    const usageInfo = getUsageInfo(req.user);
    res.json({ hint, usage: usageInfo, unlimited, usedFallback, fallbackReason });
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
    const { result: analysis, unlimited, usedFallback, fallbackReason } = outcome;

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
    res.json({ ...sections, usage: usageInfo, unlimited, usedFallback, fallbackReason });
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

async function getUsage(req, res) {
  const user = req.user;
  if (!user) return fail(res, 401, 'Unauthorized');
  
  const usageInfo = getUsageInfo(user);
  return success(res, usageInfo);
}

module.exports = { getHint, analyzeCode, getUsage };
