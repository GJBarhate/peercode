'use strict';

const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: {
          type: String,
          enum: ['interviewer', 'interviewee', 'observer'],
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed'],
      default: 'waiting',
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
    },
    maxParticipants: {
      type: Number,
      default: 3,
      max: 10,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    isPrivate: { type: Boolean, default: false },
    isRanked: { type: Boolean, default: true },
    customTimeLimit: { type: Number },
    isPublic: { type: Boolean, default: true },
    spectatorCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-expire orphaned rooms after 24 hours
RoomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Room', RoomSchema);
