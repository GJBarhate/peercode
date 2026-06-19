'use strict';

const mongoose = require('mongoose');

const MigrationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
}, { timestamps: true });

module.exports = mongoose.models.Migration || mongoose.model('Migration', MigrationSchema);
