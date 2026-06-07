'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    
    const user = await User.findOne({username:'testuser2'});
    if(user) {
      console.log(`testuser2 ID: ${user._id}`);
    } else {
      console.log('testuser2 not found');
    }
  } finally {
    await mongoose.disconnect();
  }
}

seed();
