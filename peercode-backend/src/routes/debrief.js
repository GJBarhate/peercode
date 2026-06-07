const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { dashboardLimiter } = require('../middleware/rateLimiter');
const { generateDebrief, getDebrief } = require('../controllers/debriefController');

// POST /api/debrief/:sessionId/generate - Generate AI debrief
router.post('/:sessionId/generate', dashboardLimiter, generateDebrief);

// GET /api/debrief/:sessionId - Get debrief for a session
router.get('/:sessionId', dashboardLimiter, getDebrief);

module.exports = router;
