'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTracks, getTrack, getAllTracksProgress, getTrackProgress, completeProblem } = require('../controllers/trackController');

router.get('/', getTracks);
router.get('/progress', auth, getAllTracksProgress);
router.get('/:slug', getTrack);
router.get('/:slug/progress', auth, getTrackProgress);
router.post('/:slug/complete-problem', auth, completeProblem);

module.exports = router;
