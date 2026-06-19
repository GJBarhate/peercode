'use strict';

const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/statsController');

router.get('/', getLeaderboard);

module.exports = router;
