'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { updateProfile, changePassword } = require('../controllers/profileController');

// PUT /api/profile - update profile (username)
router.put('/', auth, updateProfile);

// PUT /api/profile/password - change password
router.put('/password', auth, changePassword);

module.exports = router;
