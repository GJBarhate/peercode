'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  const MAX_ATTEMPTS = 5;
  let delay = 1000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 20,
      });
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      logger.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(`Failed to connect to MongoDB after ${MAX_ATTEMPTS} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

module.exports = { connectDB };
