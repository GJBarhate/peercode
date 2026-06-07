'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Session = require('../models/Session');
const Room = require('../models/Room');
const Problem = require('../models/Problem');
const AiDebrief = require('../models/AiDebrief');
const User = require('../models/User');
const { callGemini } = require('../config/gemini');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    console.log('Connected to MongoDB');

    // Get the test session
    const session = await Session.findOne({ roomId: 'test-room-123' });
    if (!session) {
      console.error('Session not found');
      process.exit(1);
    }

    // Get the room
    const room = await Room.findOne({ roomId: 'test-room-123' }).populate('problemId');
    if (!room) {
      console.error('Room not found');
      process.exit(1);
    }

    // Get participants
    const participantIds = session.participants || [];
    console.log(`Found ${participantIds.length} participants`);

    if (participantIds.length === 0) {
      console.error('No participants in session');
      process.exit(1);
    }

    // Generate debrief
    const snapshots = session.snapshots || [];
    const firstCode = snapshots.length > 0 ? (snapshots[0].code || '') : '';
    const lastCode = snapshots.length > 0 ? (snapshots[snapshots.length - 1].code || '') : '';

    const problemTitle = room && room.problemId ? room.problemId.title : 'Unknown Problem';
    const problemDifficulty = room && room.problemId ? room.problemId.difficulty : 'unknown';
    const duration = session.duration || 0;

    const prompt = `You are an expert technical interview coach. Analyze this coding session and respond ONLY with valid JSON, no markdown.

Problem: ${problemTitle} (${problemDifficulty})
Duration: ${duration} seconds
Opening code:
${firstCode || '(empty)'}

Final code:
${lastCode || '(empty)'}

JSON structure:
{
  "communication_score": <int 1-5>,
  "decomposition_score": <int 1-5>,
  "code_quality_score": <int 1-5>,
  "complexity_score": <int 1-5>,
  "overall_readiness": <int 1-10>,
  "what_went_well": ["<string>", "<string>", "<string>"],
  "areas_to_improve": ["<string>", "<string>", "<string>"],
  "study_next": ["<string>", "<string>", "<string>"],
  "weak_topics": ["<string>", "<string>"],
  "summary": "<string>"
}`;

    console.log('Calling Gemini API...');
    const raw = await callGemini(prompt);
    console.log('Raw Gemini response:', raw);

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    console.log('Parsed response:', parsed);

    // Create debrief for each participant
    for (const participantId of participantIds) {
      const debrief = await AiDebrief.findOneAndUpdate(
        { roomId: 'test-room-123', generatedFor: participantId },
        {
          $set: {
            sessionId: session._id,
            roomId: 'test-room-123',
            generatedFor: participantId,
            scores: {
              communication: parsed.communication_score,
              decomposition: parsed.decomposition_score,
              codeQuality: parsed.code_quality_score,
              complexity: parsed.complexity_score,
            },
            overallReadiness: parsed.overall_readiness,
            whatWentWell: parsed.what_went_well || [],
            areasToImprove: parsed.areas_to_improve || [],
            studyNext: parsed.study_next || [],
            weakTopics: parsed.weak_topics || [],
            summary: parsed.summary || '',
          },
        },
        { upsert: true, new: true }
      );
      console.log(`Debrief created for participant ${participantId}`);
    }

    console.log('Debrief generation complete');
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
