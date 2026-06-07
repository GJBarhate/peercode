'use strict';

const express = require('express');
const router = express.Router();
const {
  getSession,
  getPlayback,
  endSession,
  getDebrief,
  getAnalytics,
  getUserSessions,
} = require('../controllers/sessionController');

router.get('/', getUserSessions);
router.get('/:roomId', getSession);
router.get('/:roomId/playback', getPlayback);
router.post('/:roomId/end', endSession);
router.get('/:roomId/debrief', getDebrief);
router.get('/:roomId/analytics', getAnalytics);

module.exports = router;
