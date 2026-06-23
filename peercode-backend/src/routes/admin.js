'use strict';

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const {
  getStats,
  getUsers,
  toggleBan,
  getProblems,
  updateProblem,
  deleteProblem,
  getReports,
  resolveReport,
  getErrorLogs,
} = require('../controllers/adminController');

router.use(adminAuth);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/toggle-ban', toggleBan);
router.get('/problems', getProblems);
router.put('/problems/:id', updateProblem);
router.delete('/problems/:id', deleteProblem);
router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);
router.get('/logs', getErrorLogs);

module.exports = router;
