'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const Room = require('../models/Room');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    console.log('Connected to MongoDB');

    // Get the two-sum problem
    const problem = await Problem.findOne({ slug: 'two-sum' });
    if (!problem) {
      console.error('Problem not found: two-sum');
      process.exit(1);
    }

    // Create a room for the test session
    const room = await Room.findOneAndUpdate(
      { roomId: 'test-room-123' },
      {
        roomId: 'test-room-123',
        problemId: problem._id,
        status: 'ended',
        language: 'javascript',
      },
      { upsert: true, new: true }
    );

    console.log(`Room created: ${room._id}`);
    console.log(`Problem: ${problem.title}`);
    console.log('Room seed complete.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
