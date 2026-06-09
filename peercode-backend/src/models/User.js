'use strict';

const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  plan: { type: String, enum: ['free', 'pro', 'premium', 'ultra'], default: 'free' },
  status: { type: String, enum: ['active', 'cancelled', 'past_due', 'trialing', 'pending'], default: 'active' },
  razorpaySubscriptionId: String,
  razorpayCustomerId: String,
  razorpayPaymentLinkId: String,
  razorpayPaymentLinkUrl: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    elo: {
      type: Number,
      default: 1200,
      min: 0,
    },
    apiKey: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    weaknessProfile: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    streakData: {
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastSessionDate: { type: Date, default: null },
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    profilePicture: String,
    solvedProblems: {
      type: [{
        problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
        solvedAt: { type: Date, default: Date.now },
      }],
      validate: {
        validator: function (arr) { return arr.length <= 100; },
        message: 'solvedProblems cannot exceed 100 entries',
      },
    },
    subscription: { type: SubscriptionSchema, default: () => ({}) },
    usage: {
      hintsUsed: { type: Number, default: 0 },
      analyzesUsed: { type: Number, default: 0 },
      periodStart: { type: Date, default: Date.now }
    }
  },
  { timestamps: true }
);

UserSchema.post('init', function () {
  if (!this.subscription) {
    this.subscription = { plan: 'free', status: 'active', cancelAtPeriodEnd: false };
  }
  if (!this.usage) {
    this.usage = { hintsUsed: 0, analyzesUsed: 0, periodStart: new Date() };
  }
});

module.exports = mongoose.model('User', UserSchema);
