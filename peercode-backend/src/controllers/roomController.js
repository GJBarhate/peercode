'use strict';

const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const Problem = require('../models/Problem');
const { fail } = require('../utils/httpResponse');

async function createRoom(req, res) {
  const { problemSlug } = req.body;
  const roomId = uuidv4();
  
  const roomData = {
    roomId,
    host: req.user.id,
    participants: [{ user: req.user.id, role: 'interviewer', joinedAt: new Date() }],
  };
  
  if (problemSlug) {
    const problem = await Problem.findOne({ slug: problemSlug, isActive: true });
    if (problem) {
      roomData.problemId = problem._id;
    }
  }
  
  const room = await Room.create(roomData);
  
  // Populate the problem data before responding
  const populatedRoom = await room.populate('problemId');
  
  res.status(201).json({
    _id: room._id,
    id: room._id,
    roomId: room.roomId,
    host: room.host,
    status: room.status,
    problem: populatedRoom.problemId || null,
    createdAt: room.createdAt
  });
}

async function getRoom(req, res) {
  const { id } = req.params;
  let room = null;
  
  // Try to find by MongoDB _id first
  try {
    room = await Room.findById(id)
      .populate('participants.user', 'username elo role')
      .populate('problemId');
  } catch (_) {}
  
  // If not found, try to find by roomId (UUID)
  if (!room) {
    room = await Room.findOne({ roomId: id })
      .populate('participants.user', 'username elo role')
      .populate('problemId')
      .lean();
  }

  if (!room) {
    return fail(res, 404, 'Room not found');
  }
  
  res.json({
    _id: room._id,
    roomId: room.roomId,
    host: room.host,
    participants: room.participants,
    status: room.status,
    problem: room.problemId,
    maxParticipants: room.maxParticipants,
    createdAt: room.createdAt
  });
}

async function joinRoom(req, res) {
  const { id } = req.params;
  let room = null;
  
  // Try to find by MongoDB _id first
  try {
    room = await Room.findById(id);
  } catch (_) {}
  
  // If not found, try to find by roomId (UUID)
  if (!room) {
    room = await Room.findOne({ roomId: id });
  }

  if (!room) {
    return fail(res, 404, 'Room not found');
  }
  if (room.status === 'completed') {
    return fail(res, 400, 'Room is already completed');
  }

  const alreadyIn = room.participants.some(
    (p) => p.user && p.user.toString() === req.user.id.toString()
  );

  if (!alreadyIn && room.participants.length >= room.maxParticipants) {
    return fail(res, 400, 'Room is full');
  }

  if (!alreadyIn) {
    const role = ['interviewer', 'interviewee', 'observer'].includes(req.body.role)
      ? req.body.role
      : 'observer';
    room.participants.push({ user: req.user.id, role, joinedAt: new Date() });
    await room.save();
  }

  res.json({ message: 'Joined room', roomId: room.roomId, error: null });
}

async function deleteRoom(req, res) {
  const { id } = req.params;
  let room = null;
  
  // Try to find by MongoDB _id first
  try {
    room = await Room.findById(id);
  } catch (_) {}
  
  // If not found, try to find by roomId (UUID)
  if (!room) {
    room = await Room.findOne({ roomId: id });
  }

  if (!room) {
    return fail(res, 404, 'Room not found');
  }
  if (room.host.toString() !== req.user.id.toString()) {
    return fail(res, 403, 'Only the host can close this room');
  }
  room.status = 'completed';
  await room.save();
  res.json({ message: 'Room closed' });
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function createPrivateRoom(req, res) {
  const { problemSlug, difficulty, isRanked = true, customTimeLimit } = req.body;
  const roomId = uuidv4();

  let inviteCode;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    attempts++;
  } while (attempts < 5 && await Room.exists({ inviteCode }));

  const roomData = {
    roomId,
    host: req.user.id,
    participants: [{ user: req.user.id, role: 'interviewer', joinedAt: new Date() }],
    isPrivate: true,
    isRanked,
    inviteCode,
    customTimeLimit: customTimeLimit || undefined,
  };

  if (problemSlug) {
    const problem = await Problem.findOne({ slug: problemSlug, isActive: true });
    if (problem) roomData.problemId = problem._id;
  } else if (difficulty) {
    const count = await Problem.countDocuments({ isActive: true, difficulty });
    if (count > 0) {
      const random = Math.floor(Math.random() * count);
      const problem = await Problem.findOne({ isActive: true, difficulty }).skip(random);
      if (problem) roomData.problemId = problem._id;
    }
  }

  const room = await Room.create(roomData);
  res.status(201).json({
    roomId: room.roomId,
    inviteCode: room.inviteCode,
    isRanked: room.isRanked,
    customTimeLimit: room.customTimeLimit,
  });
}

async function joinPrivateRoom(req, res) {
  const { inviteCode } = req.params;
  const room = await Room.findOne({ inviteCode: inviteCode.toUpperCase() })
    .populate('problemId', 'title slug difficulty')
    .lean();

  if (!room) return fail(res, 404, 'Invalid invite code');
  if (room.status === 'completed') return fail(res, 400, 'This room has ended');

  res.json({
    roomId: room.roomId,
    problem: room.problemId,
    isRanked: room.isRanked,
    customTimeLimit: room.customTimeLimit,
    participantCount: room.participants.length,
  });
}

module.exports = { createRoom, getRoom, joinRoom, deleteRoom, createPrivateRoom, joinPrivateRoom };
