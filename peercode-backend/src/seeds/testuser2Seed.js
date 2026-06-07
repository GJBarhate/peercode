'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    console.log('Connected to MongoDB');

    const password = 'test123456';
    const passwordHash = await bcrypt.hash(password, 12);

    // Create testuser2
    const user2 = await User.create({
      username: 'testuser2',
      email: 'testuser2@example.com',
      passwordHash,
      role: 'user',
      elo: 1200,
    });

    console.log(`\ntestuser2 created:`);
    console.log(`ID: ${user2._id}`);
    console.log(`Username: ${user2.username}`);
    console.log(`Email: ${user2.email}`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
