'use strict';

const express = require('express');
const router = express.Router();
const { userGeminiLimiter } = require('../middleware/rateLimiter');
const { generateQuestions, evaluateAnswer, generateFeedback } = require('../controllers/interviewController');

router.post('/questions', userGeminiLimiter, generateQuestions);
router.post('/evaluate', userGeminiLimiter, evaluateAnswer);
router.post('/feedback', userGeminiLimiter, generateFeedback);

module.exports = router;
