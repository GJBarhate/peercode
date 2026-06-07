'use strict';

const Agenda = require('agenda');
const mongoose = require('mongoose');

const agenda = new Agenda({
  mongo: mongoose.connection,
  db: { collection: 'agendaJobs' },
});

module.exports = { agenda };
