'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, updateApiKey, getUserSolvedProblems } = require('../controllers/userController');
const { getUserStats } = require('../controllers/statsController');

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/api-key', auth, updateApiKey);
router.get('/solved-problems', auth, getUserSolvedProblems);
router.get('/me/stats', auth, getUserStats);

module.exports = router;
