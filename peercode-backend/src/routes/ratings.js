'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { submitRating, getUserRatings } = require('../controllers/ratingController');

router.post('/', auth, validate(schemas.submitRating), submitRating);
router.get('/me', auth, getUserRatings);
router.get('/:userId', auth, getUserRatings);

module.exports = router;
