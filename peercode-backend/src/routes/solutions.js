'use strict';

const router = require('express').Router();
const auth = require('../middleware/auth');
const { getSolutions, createSolution, upvoteSolution } = require('../controllers/solutionController');

router.get('/:problemId', auth, getSolutions);
router.post('/:problemId', auth, createSolution);
router.put('/:id/upvote', auth, upvoteSolution);

module.exports = router;
