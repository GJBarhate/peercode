'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { createRoom, getRoom, joinRoom, deleteRoom, createPrivateRoom, joinPrivateRoom } = require('../controllers/roomController');

router.post('/', auth, validate(schemas.createRoom), createRoom);
router.post('/private', auth, createPrivateRoom);
router.get('/join/:inviteCode', auth, joinPrivateRoom);
router.get('/:id', auth, getRoom);
router.post('/:id/join', auth, joinRoom);
router.delete('/:id', auth, deleteRoom);

module.exports = router;
