'use strict';

const express = require('express');
const router = express.Router();
const { userGeminiLimiter } = require('../middleware/rateLimiter');
const { getHint, analyzeCode, generateQuestion, getUsage } = require('../controllers/geminiController');

router.post('/hint', userGeminiLimiter, getHint);
router.post('/analyze', userGeminiLimiter, analyzeCode);
router.post('/generate-question', userGeminiLimiter, generateQuestion);
router.get('/usage', getUsage);

module.exports = router;
