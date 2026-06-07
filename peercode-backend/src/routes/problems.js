'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getProblemStats,
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  reportProblem,
  solveProblem,
} = require('../controllers/problemController');

router.get('/stats', getProblemStats);
router.get('/', getProblems);
router.get('/:slug', getProblem);
router.post('/', auth, adminAuth, createProblem);
router.put('/:id', auth, adminAuth, updateProblem);
router.post('/:id/report', auth, reportProblem);
router.post('/:slug/solve', auth, solveProblem);

module.exports = router;
