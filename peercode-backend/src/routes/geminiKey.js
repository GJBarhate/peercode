'use strict';

const express = require('express');
const { validateGeminiKey } = require('../controllers/geminiKeyController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/validate', auth, validateGeminiKey);

module.exports = router;