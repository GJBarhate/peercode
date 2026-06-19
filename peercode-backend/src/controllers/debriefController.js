'use strict';

const Session = require('../models/Session');
const AiDebrief = require('../models/AiDebrief');
const Problem = require('../models/Problem');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ok: success, fail } = require('../utils/httpResponse');
const logger = require('../utils/logger');

// Initialize Gemini (use first available key or env key)
function getGeminiAI() {
  const apiKey = process.env.GEMINI_KEY_1 || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No Gemini API key configured');
  return new GoogleGenerativeAI(apiKey);
}

async function generateDebrief(req, res) {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    if (!sessionId) {
      return fail(res, 400, 'sessionId is required');
    }

    // Fetch session with populated references
    const session = await Session.findById(sessionId)
      .populate('problem')
      .populate('participants', 'username email');

    if (!session) {
      return fail(res, 404, 'Session not found');
    }

    // Check if user is a participant
    const isParticipant = session.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      return fail(res, 403, 'Unauthorized: you are not a participant in this session');
    }

    // Check if debrief already exists and is recent (< 24 hours)
    if (session.debrief) {
      const existingDebrief = await AiDebrief.findById(session.debrief);
      if (existingDebrief && (Date.now() - existingDebrief.createdAt < 24 * 60 * 60 * 1000)) {
        return success(res, existingDebrief, 'Debrief retrieved from cache');
      }
    }

    // Build Gemini prompt
    const problemTitle = session.problemSnapshot?.title || session.problem?.title || 'Unknown Problem';
    const difficulty = session.problemSnapshot?.difficulty || session.problem?.difficulty || 'unknown';
    const code = session.finalCode || '';
    const duration = Math.round((session.duration || 0) / 60); // Convert to minutes
    const language = session.finalLanguage || 'Unknown';

    const prompt = `You are a senior software engineer. Analyze this mock interview session and provide constructive feedback.

Problem: ${problemTitle} (${difficulty} difficulty)
Language: ${language}
Duration: ${duration} minutes
Final Code:
\`\`\`
${code}
\`\`\`

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:
{
  "whatWentWell": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasToImprove": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "summary": "<2-3 sentences about overall performance>",
  "scores": {
    "communication": <number 1-5>,
    "decomposition": <number 1-5>,
    "codeQuality": <number 1-5>,
    "complexity": <number 1-5>
  },
  "overallReadiness": <number 1-10>,
  "overallScore": <number 0-100>,
  "studyNext": ["<actionable tip 1>", "<actionable tip 2>"],
  "weakTopics": ["<topic 1>", "<topic 2>"],
  "timeComplexity": "<Big-O and explanation>",
  "spaceComplexity": "<Big-O and explanation>",
  "approachAnalysis": "<paragraph about problem-solving approach>",
  "interviewerPerspective": "<what an interviewer would think>",
  "improvementPlan": ["<step 1>", "<step 2>", "<step 3>"],
  "similarProblems": [
    {"title": "<name>", "difficulty": "<easy|medium|hard>", "reason": "<why relevant>"},
    {"title": "<name>", "difficulty": "<easy|medium|hard>", "reason": "<why relevant>"}
  ]
}`;

    // Validate Gemini AI config before inner try
    let genAI;
    try {
      genAI = getGeminiAI();
    } catch (configErr) {
      logger.error('Gemini AI configuration error:', configErr);
      return fail(res, 500, 'AI service not configured');
    }

    try {
      // Call Gemini with timeout
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), 30000)
      );

      const generatePromise = model.generateContent(prompt);
      const response = await Promise.race([generatePromise, timeoutPromise]);

      const responseText = response.response.text();

      // Parse JSON response
      let debriefData;
      try {
        // Slice from first { to last } — handles markdown preamble and trailing text
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace <= firstBrace) throw new Error('No JSON in response');
        debriefData = JSON.parse(responseText.slice(firstBrace, lastBrace + 1));
      } catch (parseErr) {
        logger.error('Failed to parse Gemini JSON response:', parseErr);
        // Return a basic debrief if parsing fails
        debriefData = {
          whatWentWell: ['Attempted problem', 'Wrote code'],
          areasToImprove: ['Testing solutions', 'Code optimization'],
          summary: 'Debrief generation encountered an issue. Your code was analyzed but feedback may be limited.',
          scores: { communication: 3, decomposition: 3, codeQuality: 3, complexity: 3 },
          overallReadiness: 5,
          studyNext: ['Test edge cases', 'Optimize iteratively'],
          weakTopics: ['Algorithm optimization', 'Test coverage']
        };
      }

      // Create AiDebrief document with mapped fields
      const aiDebrief = new AiDebrief({
        sessionId: sessionId,
        roomId: session.roomId || '',
        generatedFor: userId,
        problemTitle: session.problemSnapshot?.title || session.problem?.title || '',
        problemDifficulty: session.problemSnapshot?.difficulty || session.problem?.difficulty || '',
        problemSlug: session.problem?.slug || '',
        sessionDate: session.createdAt || new Date(),
        duration: session.duration || 0,
        summary: debriefData.summary || 'Debrief generated',
        scores: debriefData.scores || {},
        overallReadiness: debriefData.overallReadiness || 5,
        overallScore: debriefData.overallScore || null,
        whatWentWell: debriefData.whatWentWell || [],
        areasToImprove: debriefData.areasToImprove || [],
        studyNext: debriefData.studyNext || [],
        weakTopics: debriefData.weakTopics || [],
        timeComplexity: debriefData.timeComplexity || '',
        spaceComplexity: debriefData.spaceComplexity || '',
        approachAnalysis: debriefData.approachAnalysis || '',
        interviewerPerspective: debriefData.interviewerPerspective || '',
        improvementPlan: debriefData.improvementPlan || [],
        similarProblems: debriefData.similarProblems || [],
      });

      await aiDebrief.save();

      // Update session with debrief reference
      session.debrief = aiDebrief._id;
      await session.save();

      return success(res, aiDebrief, 'Debrief generated successfully');
    } catch (geminiErr) {
      logger.error('Gemini API error:', geminiErr);
      
      // Return a fallback debrief if Gemini fails
      const fallbackDebrief = {
        sessionId: sessionId,
        roomId: session.roomId || '',
        generatedFor: userId,
        summary: 'AI debrief service temporarily unavailable. Please try again later.',
        scores: { communication: 2, decomposition: 2, codeQuality: 2, complexity: 2 },
        overallReadiness: 4,
        whatWentWell: ['Completed attempt'],
        areasToImprove: ['Unable to analyze - please retry'],
        studyNext: ['Try generating debrief again'],
        weakTopics: ['Unable to assess']
      };

      const aiDebrief = new AiDebrief(fallbackDebrief);
      await aiDebrief.save();
      session.debrief = aiDebrief._id;
      await session.save();

      return success(res, aiDebrief, 'Debrief generated (fallback)');
    }
  } catch (err) {
    logger.error('Generate debrief error:', err);
    return fail(res, 500, 'Failed to generate debrief');
  }
}

async function getDebrief(req, res) {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || req.user?.userId;

    const session = await Session.findById(sessionId).populate('participants', '_id');
    if (!session) {
      return fail(res, 404, 'Session not found');
    }

    const isParticipant = session.participants.some(p => p._id.toString() === userId);
    if (!isParticipant) {
      return fail(res, 403, 'Unauthorized');
    }

    if (!session.debrief) {
      return fail(res, 404, 'Debrief not found');
    }

    const debrief = await AiDebrief.findById(session.debrief);
    return success(res, debrief || {}, 'Debrief retrieved');
  } catch (err) {
    logger.error('Get debrief error:', err);
    return fail(res, 500, 'Failed to fetch debrief');
  }
}

module.exports = { generateDebrief, getDebrief };
