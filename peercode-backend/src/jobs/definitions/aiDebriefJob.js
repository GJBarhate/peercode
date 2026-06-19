'use strict';

const Session = require('../../models/Session');
const Room = require('../../models/Room');
const AiDebrief = require('../../models/AiDebrief');
const User = require('../../models/User');
const Snapshot = require('../../models/Snapshot');
const { callGemini } = require('../../config/gemini');
const logger = require('../../utils/logger');

module.exports = function defineAiDebriefJob(agenda) {
  agenda.define('ai-debrief', async (job) => {
    const { roomId, participantIds } = job.attrs.data;

    if (!participantIds || participantIds.length === 0) return;

    const existing = await AiDebrief.findOne({ roomId });
    if (existing) {
      logger.info(`AI Debrief: already exists for roomId ${roomId}, skipping`);
      return;
    }

    const session = await Session.findOne({ roomId });
    const room = await Room.findOne({ roomId }).populate('problemId');

    if (!session) {
      logger.error('AI Debrief: session not found for roomId', roomId);
      return;
    }

    // Fetch snapshots from separate collection
    const snapshots = await Snapshot.find({ sessionId: session._id }).sort({ timestamp: 1 });
    const firstCode = snapshots.length > 0 ? (snapshots[0].code || '') : '';
    const lastCode = snapshots.length > 0 ? (snapshots[snapshots.length - 1].code || '') : '';

    const problemTitle = room && room.problemId ? room.problemId.title : 'Unknown Problem';
    const problemDifficulty = room && room.problemId ? room.problemId.difficulty : 'unknown';
    const duration = session.duration || 0;

    const prompt = `You are an expert technical interview coach. Analyze this coding session and respond ONLY with valid JSON, no markdown, no extra text.

Problem: ${problemTitle} (${problemDifficulty})
Duration: ${duration} seconds
Opening code:
${firstCode || '(empty)'}

Final code:
${lastCode || '(empty)'}

Return this exact JSON structure (fill every field):
{
  "communication_score": <int 1-5>,
  "decomposition_score": <int 1-5>,
  "code_quality_score": <int 1-5>,
  "complexity_score": <int 1-5>,
  "overall_readiness": <int 1-10>,
  "overall_score": <int 0-100>,
  "what_went_well": ["<string>", "<string>", "<string>"],
  "areas_to_improve": ["<string>", "<string>", "<string>"],
  "study_next": ["<string>", "<string>", "<string>"],
  "weak_topics": ["<string>", "<string>"],
  "summary": "<2-3 sentences>",
  "time_complexity": "<Big-O notation and explanation>",
  "space_complexity": "<Big-O notation and explanation>",
  "approach_analysis": "<paragraph: how they broke down the problem, what patterns they used>",
  "interviewer_perspective": "<paragraph: what a real interviewer would say about this solution>",
  "improvement_plan": ["<step 1>", "<step 2>", "<step 3>"],
  "similar_problems": [
    {"title": "<problem title>", "difficulty": "<easy|medium|hard>", "reason": "<why it's relevant>"},
    {"title": "<problem title>", "difficulty": "<easy|medium|hard>", "reason": "<why it's relevant>"},
    {"title": "<problem title>", "difficulty": "<easy|medium|hard>", "reason": "<why it's relevant>"}
  ]
}`;

    let parsed;
    try {
      // Call Gemini with 30 second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), 30000)
      );
      const raw = await Promise.race([callGemini(prompt), timeoutPromise]);
      const cleaned = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      logger.error('AI Debrief: failed to parse Gemini response:', err.message);
      // Use fallback debrief with default scores
      parsed = {
        communication_score: 3,
        decomposition_score: 3,
        code_quality_score: 3,
        complexity_score: 3,
        overall_readiness: 5,
        overall_score: 50,
        what_went_well: ['Attempted the problem', 'Showed effort', 'Engaged with the task'],
        areas_to_improve: ['Code clarity', 'Edge case handling', 'Time complexity awareness'],
        study_next: ['Arrays', 'Hash Maps', 'Dynamic Programming'],
        weak_topics: ['optimization', 'edge cases'],
        summary: 'Session analysis is being generated. Please check back shortly.',
        time_complexity: 'O(n) — estimated',
        space_complexity: 'O(1) — estimated',
        approach_analysis: 'Unable to analyze approach — please try regenerating.',
        interviewer_perspective: 'Analysis unavailable.',
        improvement_plan: ['Review the problem statement carefully', 'Test edge cases', 'Optimize after correctness'],
        similar_problems: [],
      };
    }

    // Save debriefs for all participants with cache expiration
    for (const participantId of participantIds) {
      try {
        const debrief = await AiDebrief.findOneAndUpdate(
          { roomId, generatedFor: participantId },
          {
            $set: {
              sessionId: session._id,
              roomId,
              generatedFor: participantId,
              scores: {
                communication: parsed.communication_score,
                decomposition: parsed.decomposition_score,
                codeQuality: parsed.code_quality_score,
                complexity: parsed.complexity_score,
              },
              overallReadiness: parsed.overall_readiness,
              overallScore: parsed.overall_score,
              whatWentWell: parsed.what_went_well || [],
              areasToImprove: parsed.areas_to_improve || [],
              studyNext: parsed.study_next || [],
              weakTopics: parsed.weak_topics || [],
              summary: parsed.summary || '',
              timeComplexity: parsed.time_complexity || '',
              spaceComplexity: parsed.space_complexity || '',
              approachAnalysis: parsed.approach_analysis || '',
              interviewerPerspective: parsed.interviewer_perspective || '',
              improvementPlan: parsed.improvement_plan || [],
              similarProblems: parsed.similar_problems || [],
              generatedAt: new Date(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          },
          { upsert: true, new: true }
        );

        logger.info(`AI Debrief saved for user ${participantId} - readiness: ${parsed.overall_readiness}/10`);

        // Update user weakness profile for recommendation engine
        const weakTopics = parsed.weak_topics || [];
        if (weakTopics.length > 0) {
          const inc = {};
          for (const topic of weakTopics) {
            const safe = topic.replace(/[.$]/g, '_');
            inc[`weaknessProfile.${safe}`] = 1;
          }
          await User.findByIdAndUpdate(participantId, { $inc: inc });
        }
      } catch (err) {
        logger.error(`AI Debrief: error saving debrief for user ${participantId}:`, err.message);
      }
    }
  });
};
