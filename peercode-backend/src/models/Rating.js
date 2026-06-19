'use strict';

const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

RatingSchema.index({ toUser: 1, createdAt: -1 });
RatingSchema.index({ fromUser: 1 });
RatingSchema.index({ fromUser: 1, toUser: 1, roomId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
