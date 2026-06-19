'use strict';

const express = require('express');
const router = express.Router();
const { getPlatformStats } = require('../controllers/statsController');
const { getBadgeDefinitions } = require('../services/BadgeService');

router.get('/platform', getPlatformStats);
router.get('/badges', (req, res) => {
  res.json({ badges: getBadgeDefinitions() });
});

module.exports = router;
