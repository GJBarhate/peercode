'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { listContests, getContest, joinContest, recordContestSolve, getContestHistory } = require('../controllers/contestController');

router.get('/', auth, listContests);
router.get('/history', auth, getContestHistory);
router.get('/:slug', auth, getContest);
router.post('/:slug/join', auth, joinContest);
router.post('/:slug/solve', auth, recordContestSolve);

module.exports = router;
