'use strict';

const nodemailer = require('nodemailer');

module.exports = function defineEmailJob(agenda) {
  agenda.define(
    'send-email',
    { priority: 'normal', concurrency: 5 },
    async (job) => {
      const { to, subject, html } = job.attrs.data;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        html,
        text,
      });
    }
  );
};
