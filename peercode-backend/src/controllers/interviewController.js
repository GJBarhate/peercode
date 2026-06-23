'use strict';

const { callGemini } = require('../config/gemini');
const { fail, ok: success } = require('../utils/httpResponse');
const logger = require('../utils/logger');
const { canUseFeature, incrementUsage, getUsageInfo } = require('../utils/subscription');

async function callWithQuota(req, feature) {
  const user = req.user;
  const userApiKey = req.headers['x-gemini-key'] || (user.apiKey || null);
  const useOwnKey = !!userApiKey;

  if (!useOwnKey) {
    const check = canUseFeature(user, feature);
    if (!check.allowed) {
      const usageInfo = getUsageInfo(user);
      const err = new Error('Monthly limit reached');
      err.status = 403;
      err.data = { upgradeRequired: true, usage: usageInfo, feature };
      throw err;
    }
  }
  return { userApiKey, useOwnKey };
}

async function generateQuestions(req, res) {
  const user = req.user;
  if (!user) return fail(res, 401, 'Unauthorized');

  const { resume, jobDescription, company, interviewType, difficulty, questionCount, excludeQuestions = [] } = req.body;
  if (!interviewType) return fail(res, 400, 'interviewType is required');

  const count = Math.min(Math.max(parseInt(questionCount, 10) || 5, 3), 15);
  const sessionSeed = Math.random().toString(36).slice(2, 10);
  const exclusionList = Array.isArray(excludeQuestions) ? excludeQuestions.slice(0, 30) : [];

  try {
    const { userApiKey, useOwnKey } = await callWithQuota(req, 'hints');

    const topicGuidance = {
      'technical-dsa': `Cover DIFFERENT topics: arrays, strings, trees, graphs, dynamic programming, sorting, searching, linked lists, stacks/queues, hash maps. Each question must test a DIFFERENT data structure or algorithm. Mix easy warm-up, medium core, and hard challenge questions. Include real coding problems with input/output examples.`,
      'behavioral': `Cover DIFFERENT themes: leadership, conflict resolution, failure/learning, teamwork, initiative, communication, prioritization, adaptability, mentoring, decision-making. Use STAR format. Each question must explore a DIFFERENT competency. Include situational and past-experience questions.`,
      'system-design': `Cover DIFFERENT systems: URL shortener, chat app, news feed, payment system, search engine, video streaming, ride-sharing, notification system, file storage, rate limiter. Each question must design a DIFFERENT system at scale. Vary between high-level architecture and deep-dive questions.`,
      'frontend': `Cover DIFFERENT areas: React component design, state management, CSS layout/animations, browser APIs, performance optimization, accessibility, testing, bundling/build tools, TypeScript, responsive design. Each question must test a DIFFERENT frontend skill.`,
      'backend': `Cover DIFFERENT areas: REST API design, database modeling, authentication/authorization, caching strategies, message queues, microservices, CI/CD, error handling, security, concurrency. Each question must test a DIFFERENT backend concept.`,
      'hr': `Cover DIFFERENT themes: career goals, motivation, salary expectations, work-life balance, company culture fit, strengths/weaknesses, why this company, remote work, learning style, management style. Each question must explore a DIFFERENT aspect of the candidate.`,
    }[interviewType] || 'Ensure each question covers a completely different topic and tests different skills.';

    const difficultyMix = count >= 6
      ? `Mix difficulties: ~30% easy (warm-up), ~50% medium (core), ~20% hard (challenge). Start easier, build up.`
      : `Mix difficulties: start with an easier warm-up, then medium, end with a challenging one.`;

    const exclusionBlock = exclusionList.length > 0
      ? `\n\nDO NOT REUSE THESE PREVIOUSLY-ASKED QUESTIONS (rephrase + pick fresh topics):\n${exclusionList.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
      : '';

    const prompt = `You are an expert interviewer at ${company || 'a top tech company'}. Generate exactly ${count} UNIQUE and DIVERSE interview questions for a ${interviewType} interview${difficulty ? ` at ${difficulty} level` : ''}.

[Variation seed: ${sessionSeed}] — use this seed to produce a different, fresh set of questions each run.

CRITICAL RULES:
- Every question MUST be on a DIFFERENT topic. NO repetition WITHIN this batch.
- Questions must be specific and detailed, not generic.
- AVOID common cliché questions (e.g. "reverse a linked list", "FizzBuzz", "two-sum", "tell me about yourself"). Pick fresher angles.
- ${topicGuidance}
- ${difficultyMix}
- Each question should be 2-4 sentences with enough context to answer.${exclusionBlock}

${resume ? `Candidate Resume:\n${resume}\n\nIMPORTANT: At least 40% of questions MUST be directly based on the candidate's resume — ask about specific projects, technologies, roles, or experiences mentioned. Probe deeper into their claimed skills. Mix resume-based questions with general ${interviewType} questions.\n` : ''}
${jobDescription ? `Job Description (align questions with required skills):\n${jobDescription}\n` : ''}

${company ? `Target Company: ${company} — use their known interview style and focus areas.` : ''}

Return ONLY a valid JSON array with exactly ${count} objects (no markdown, no code fences):
[
  {
    "id": 1,
    "question": "detailed unique question text",
    "type": "${interviewType}",
    "difficulty": "easy|medium|hard",
    "expectedTopics": ["topic1", "topic2"],
    "timeLimit": 300
  }
]`;

    const result = await callGemini(prompt, userApiKey);
    if (!useOwnKey) await incrementUsage(user, 'hints');

    let questions;
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questions = JSON.parse(cleaned);
    } catch {
      questions = [
        { id: 1, question: result, type: interviewType, difficulty: 'medium', expectedTopics: [], timeLimit: 300 }
      ];
    }

    const usageInfo = getUsageInfo(user);
    return success(res, { questions, usage: usageInfo, unlimited: useOwnKey });
  } catch (err) {
    if (err.status === 403) return fail(res, 403, err.message, err.data);
    logger.error('Interview question generation error:', err);
    return fail(res, 502, 'Failed to generate questions. Please try again.');
  }
}

async function evaluateAnswer(req, res) {
  const user = req.user;
  if (!user) return fail(res, 401, 'Unauthorized');

  const { question, answer, interviewType, questionIndex, totalQuestions } = req.body;
  if (!question || !answer) return fail(res, 400, 'question and answer are required');

  try {
    const { userApiKey, useOwnKey } = await callWithQuota(req, 'analyzes');

    const prompt = `You are an expert interviewer evaluating a candidate's answer.

Question (${interviewType}, ${questionIndex + 1}/${totalQuestions}):
${question}

Candidate's Answer:
${answer}

Evaluate the answer and return ONLY valid JSON (no markdown, no code fences):
{
  "score": <number 1-10>,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "feedback": "detailed feedback paragraph",
  "followUp": "a follow-up question you would ask"
}`;

    const result = await callGemini(prompt, userApiKey);
    if (!useOwnKey) await incrementUsage(user, 'analyzes');

    let evaluation;
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      evaluation = JSON.parse(cleaned);
    } catch {
      evaluation = { score: 5, strengths: [], improvements: [], feedback: result, followUp: '' };
    }

    const usageInfo = getUsageInfo(user);
    return success(res, { evaluation, usage: usageInfo, unlimited: useOwnKey });
  } catch (err) {
    if (err.status === 403) return fail(res, 403, err.message, err.data);
    logger.error('Interview evaluation error:', err);
    return fail(res, 502, 'Failed to evaluate answer. Please try again.');
  }
}

async function generateFeedback(req, res) {
  const user = req.user;
  if (!user) return fail(res, 401, 'Unauthorized');

  const { questions, answers, evaluations, interviewType, company, resume } = req.body;
  if (!questions || !answers) return fail(res, 400, 'questions and answers are required');

  try {
    const { userApiKey, useOwnKey } = await callWithQuota(req, 'analyzes');

    const qaPairs = questions.map((q, i) => {
      const qText = typeof q === 'string' ? q : q.question;
      const aText = answers[i] || '(no answer provided)';
      const scoreInfo = evaluations?.[i]?.score ? `\nPrior Score: ${evaluations[i].score}/10` : '';
      return `Question ${i + 1}: ${qText}\nAnswer ${i + 1}: ${aText}${scoreInfo}`;
    }).join('\n\n---\n\n');

    const prompt = `You are a senior interviewer at ${company || 'a top tech company'}. Evaluate each answer carefully and provide comprehensive final feedback for this ${interviewType} interview.
${resume ? `\nCandidate Resume:\n${resume}\nConsider the resume context when evaluating — did the candidate's answers align with their claimed experience? Note any gaps between resume claims and demonstrated knowledge.\n` : ''}
Interview Transcript:
${qaPairs}

Score each answer, then provide overall feedback. Return ONLY valid JSON (no markdown, no code fences):
{
  "overallScore": <number 1-100>,
  "grade": "A+|A|B+|B|C+|C|D|F",
  "verdict": "Strong Hire|Hire|Lean Hire|Lean No Hire|No Hire",
  "summary": "2-3 sentence overall summary of the candidate's performance",
  "strengths": ["strength1", "strength2", "strength3"],
  "areasToImprove": ["area1", "area2", "area3"],
  "recommendations": ["specific actionable recommendation 1", "recommendation 2", "recommendation 3"],
  "topicBreakdown": [
    {"topic": "topic name", "score": <1-10>, "comment": "brief comment"}
  ]
}`;

    const result = await callGemini(prompt, userApiKey);
    if (!useOwnKey) await incrementUsage(user, 'analyzes');

    let feedback;
    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      feedback = JSON.parse(cleaned);
    } catch {
      feedback = { overallScore: 50, grade: 'C', verdict: 'Lean No Hire', summary: result, strengths: [], areasToImprove: [], recommendations: [], topicBreakdown: [] };
    }

    const usageInfo = getUsageInfo(user);
    return success(res, { feedback, usage: usageInfo, unlimited: useOwnKey });
  } catch (err) {
    if (err.status === 403) return fail(res, 403, err.message, err.data);
    logger.error('Interview feedback error:', err);
    return fail(res, 502, 'Failed to generate feedback. Please try again.');
  }
}

module.exports = { generateQuestions, evaluateAnswer, generateFeedback };
