'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTracks, getTrack, getAllTracksProgress, getTrackProgress, completeProblem } = require('../controllers/trackController');

const cache = (maxAge) => (_, res, next) => { res.set('Cache-Control', `public, max-age=${maxAge}`); next(); };

router.get('/', cache(300), getTracks);
router.get('/progress', auth, getAllTracksProgress);
router.get('/:slug', cache(120), getTrack);
router.get('/:slug/progress', auth, getTrackProgress);
router.post('/:slug/complete-problem', auth, completeProblem);

module.exports = router;
