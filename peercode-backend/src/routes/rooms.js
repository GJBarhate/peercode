'use strict';

const express = require('express');
const router = express.Router();
const { createRoom, getRoom, joinRoom, deleteRoom } = require('../controllers/roomController');

router.post('/', createRoom);
router.post('/create', createRoom);
router.get('/:id', getRoom);
router.post('/:id/join', joinRoom);
router.delete('/:id', deleteRoom);

module.exports = router;
