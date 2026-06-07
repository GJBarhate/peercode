'use strict';

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateApiKey, getUserSolvedProblems } = require('../controllers/userController');

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/api-key', updateApiKey);
router.get('/solved-problems', getUserSolvedProblems);

module.exports = router;
