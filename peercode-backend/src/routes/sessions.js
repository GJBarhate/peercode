'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getSession,
  getPlayback,
  endSession,
  getDebrief,
  getAnalytics,
  getUserSessions,
} = require('../controllers/sessionController');

router.get('/', auth, getUserSessions);
router.get('/:roomId', auth, getSession);
router.get('/:roomId/playback', auth, getPlayback);
router.post('/:roomId/end', auth, endSession);
router.get('/:roomId/debrief', auth, getDebrief);
router.get('/:roomId/analytics', auth, getAnalytics);

module.exports = router;
