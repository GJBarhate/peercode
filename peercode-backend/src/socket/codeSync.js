'use strict';

const Session = require('../models/Session');
const Snapshot = require('../models/Snapshot');
const Problem = require('../models/Problem');
const logger = require('../utils/logger');
const { wrapCodeForTest, extractFunctionName, getLanguageId } = require('../utils/executeHelpers');
const axios = require('axios');

const JUDGE0_URL = 'https://ce.judge0.com/submissions';

module.exports = function (io) {
  const snapshotTimers = new Map();
  const roomChats = new Map(); // Store chat messages per room

  io.on('connection', (socket) => {
    // ...existing code...
    socket.on('yjs-update', (roomId, update) => {
      io.to(roomId).except(socket.id).emit('yjs-update', update);
    });

    socket.on('yjs-request-state', (roomId) => {
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      if (roomSockets) {
        for (const sid of roomSockets) {
          if (sid !== socket.id) {
            io.to(sid).emit('yjs-state-request', { requesterSocketId: socket.id });
            break;
          }
        }
      }
    });

    socket.on('yjs-state-response', (to, state) => {
      io.to(to).emit('yjs-state-response', state);
    });

    socket.on('cursor-update', (roomId, cursor) => {
      io.to(roomId).except(socket.id).emit('cursor-update', {
        ...cursor,
        socketId: socket.id,
      });
    });

    socket.on('code-snapshot', (roomId, code, language) => {
      if (!roomId) {
        return;
      }

      const timerKey = `${roomId}`;
      if (snapshotTimers.has(timerKey)) {
        clearTimeout(snapshotTimers.get(timerKey));
      }

      const timer = setTimeout(async () => {
        snapshotTimers.delete(timerKey);
        try {
          // Find session to get sessionId
          const session = await Session.findOne({ roomId });
          if (!session) {
            logger.warn(`Session not found for room ${roomId}, skipping snapshot`);
            return;
          }

          // Create new Snapshot document
          const snapshot = await Snapshot.create({
            sessionId: session._id,
            roomId,
            timestamp: new Date(),
            code,
            language,
            userId: socket.user.id,
          });

          // Update Session to reference the snapshot
          await Session.findOneAndUpdate(
            { roomId },
            {
              $push: {
                snapshots: snapshot._id,
              },
            },
            { new: true, upsert: false }
          );
        } catch (err) {
          logger.error('Error saving code snapshot:', err.message);
        }
      }, 5000);

      snapshotTimers.set(timerKey, timer);
    });

    socket.on('chat-message', (roomIdOrPayload, messageArg) => {
      const payload = typeof roomIdOrPayload === 'object' && roomIdOrPayload !== null
        ? roomIdOrPayload
        : {
            roomId: roomIdOrPayload,
            text: messageArg && messageArg.text,
          };

      if (!payload.roomId || !payload.text) {
        return;
      }

      const message = {
        id: Date.now(),
        userId: socket.data.userId,
        username: socket.data.username,
        text: payload.text,
        timestamp: new Date(),
      };

      // Store message in memory
      if (!roomChats.has(payload.roomId)) {
        roomChats.set(payload.roomId, []);
      }
      roomChats.get(payload.roomId).push(message);

      // Keep last 100 messages per room
      const messages = roomChats.get(payload.roomId);
      if (messages.length > 100) {
        messages.shift();
      }

      // Broadcast to all participants including sender
      io.to(payload.roomId).emit('chat-message', message);
      logger.debug(`💬 Chat in room ${payload.roomId}: ${socket.data.username}: ${payload.text.substring(0, 50)}`);
    });

    socket.on('get-chat-history', (roomId) => {
      if (!roomId) return;
      const messages = roomChats.get(roomId) || [];
      socket.emit('chat-history', messages);
    });

    socket.on('run-code-result', (payload) => {
      const { roomId } = payload || {};
      if (roomId) {
        io.to(roomId).emit('run-code-result', payload);
      }
    });

    socket.on('run-code', async (payload) => {
      try {
        const { roomId, code, language, testCases, problemSlug, problemId } = payload || {};
        if (!roomId || !code || !language || !testCases?.length) return;

        let functionName = null;
        try {
          let problem = null;
          if (problemId) problem = await Problem.findById(problemId).select('starterCode');
          else if (problemSlug) problem = await Problem.findOne({ slug: problemSlug }).select('starterCode');
          if (problem?.starterCode) {
            functionName = extractFunctionName(problem.starterCode, language);
          }
        } catch (e) { logger.warn('run-code: Could not fetch problem:', e.message); }
        const hasSolutionClass = code.includes('class Solution');
        if (!functionName && problemSlug) functionName = problemSlug.split('-').map((p,i)=>i===0?p:p[0].toUpperCase()+p.slice(1)).join('');
        if (!functionName) functionName = 'solution';

        let languageId;
        try { languageId = getLanguageId(language); } catch (e) { return socket.emit('run-code-result', { roomId, error: e.message }); }

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
            const passed = actualOutput === expectedOutput;
            const statusId = response.data.status?.id;
            const statusDesc = response.data.status?.description || 'Unknown';
            let error = null;
            if (statusId === 6) error = response.data.compile_output || 'Compilation Error';
            else if (statusId === 11) error = response.data.runtime_error || 'Runtime Error';
            else if (statusId === 5) error = 'Time Limit Exceeded';
            else if (response.data.stderr) error = response.data.stderr;
            results.push({ index: i, input: tc.input, expectedOutput: tc.expectedOutput, actualOutput, passed, executionTime, time: response.data.time || (executionTime/1000).toFixed(3), memory: response.data.memory ? Math.round(response.data.memory/1024) : 0, status: statusDesc, statusId, error });
          } catch (e) {
            results.push({ index: i, input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: '', passed: false, executionTime: 0, time: '0', memory: 0, status: 'Error', error: e.message || 'Execution service unavailable' });
          }
        }

        const passedCount = results.filter(r => r.passed).length;
        io.to(roomId).emit('run-code-result', {
          roomId,
          results,
          allPassed: passedCount === results.length && results.length > 0,
          passedCount,
          totalCount: results.length,
          language,
          runBy: socket.user?.username || 'Unknown',
          timestamp: Date.now()
        });
      } catch (e) {
        logger.error('run-code error:', e.message);
        socket.emit('run-code-result', { roomId: payload?.roomId, error: e.message });
      }
    });

    socket.on('disconnect', () => {
      // Cleanup empty chat rooms
      for (const [roomId, messages] of roomChats.entries()) {
        if (messages.length === 0) {
          roomChats.delete(roomId);
        }
      }

      // Clear pending snapshot timers for disconnected user's rooms
      for (const [timerKey, timer] of snapshotTimers.entries()) {
        clearTimeout(timer);
        snapshotTimers.delete(timerKey);
      }
    });
  });
};
