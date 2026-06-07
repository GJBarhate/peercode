'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const ProblemReport = require('../models/ProblemReport');
const User = require('../models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    console.log('Connected to MongoDB');

    // Get test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.error('Test user not found');
      process.exit(1);
    }

    // Get a problem
    const problem = await Problem.findOne({ slug: 'two-sum' });
    if (!problem) {
      console.error('Problem not found');
      process.exit(1);
    }

    // Create a problem report
    const report = await ProblemReport.create({
      problem: problem._id,
      reportedBy: user._id,
      type: 'unclear-description',
      description: 'The problem description is not clear enough',
    });

    console.log(`\nReport created:`);
    console.log(`ID: ${report._id}`);
    console.log(`Type: ${report.type}`);
    console.log(`Status: ${report.status}`);
    console.log(`Description: ${report.description}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
