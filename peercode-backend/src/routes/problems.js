'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const adminAuth = require('../middleware/adminAuth');
const {
  getProblemStats,
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  reportProblem,
  solveProblem,
  getDailyProblem,
  getRecommendedProblems,
} = require('../controllers/problemController');

const cache = (maxAge) => (_, res, next) => { res.set('Cache-Control', `public, max-age=${maxAge}`); next(); };

router.get('/stats', cache(300), getProblemStats);
router.get('/daily', cache(3600), getDailyProblem);
router.get('/recommended', auth, getRecommendedProblems);
router.get('/', optionalAuth, cache(60), getProblems);
router.get('/:slug', optionalAuth, cache(120), getProblem);
router.post('/', auth, adminAuth, createProblem);
router.put('/:id', auth, adminAuth, updateProblem);
router.post('/:id/report', auth, reportProblem);
router.post('/:slug/solve', auth, solveProblem);

module.exports = router;
