'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    console.log('Connected to MongoDB');

    // Create test users
    const user1 = await User.findOneAndUpdate(
      { email: 'test@example.com' },
      {
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        elo: 1200,
      },
      { upsert: true, new: true }
    );

    const user2 = await User.findOneAndUpdate(
      { email: 'test2@example.com' },
      {
        email: 'test2@example.com',
        name: 'Test User 2',
        role: 'user',
        elo: 1200,
      },
      { upsert: true, new: true }
    );

    console.log(`Created/Updated users: ${user1._id}, ${user2._id}`);

    // Create a session
    const session = await Session.create({
      roomId: 'test-room-123',
      participants: [user1._id, user2._id],
      startTime: new Date(Date.now() - 3600000),
      snapshots: [
        {
          timestamp: new Date(Date.now() - 3500000),
          code: 'function twoSum() {}',
          language: 'javascript',
          userId: user1._id,
        },
        {
          timestamp: new Date(Date.now() - 1800000),
          code: `function twoSum(nums, target) {
  const map = {};
  for(let i=0;i<nums.length;i++){
    if(map[target-nums[i]]!==undefined) return [map[target-nums[i]],i];
    map[nums[i]]=i;
  }
}`,
          language: 'javascript',
          userId: user1._id,
        },
        {
          timestamp: new Date(Date.now() - 600000),
          code: `function twoSum(nums, target) {
  const map = new Map();
  for(let i=0;i<nums.length;i++){
    const comp = target - nums[i];
    if(map.has(comp)) return [map.get(comp), i];
    map.set(nums[i], i);
  }
}`,
          language: 'javascript',
          userId: user1._id,
        },
      ],
      isRecording: false,
    });

    console.log(`Session created: ${session._id}`);
    console.log('Session seed complete.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
