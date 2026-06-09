'use strict';

const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

module.exports = function defineEmailJob(agenda) {
  agenda.define(
    'send-email',
    { priority: 'normal', concurrency: 5 },
    async (job) => {
      const { to, subject, html } = job.attrs.data;

      const isDev = process.env.NODE_ENV === 'development';

      if (isDev && (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS)) {
        logger.info(`[DEV MODE] Email would be sent to ${to}: ${subject}`);
        logger.info(`[DEV MODE] HTML content: ${html}`);
        return;
      }

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

      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to,
          subject,
          html,
          text,
        });
      } catch (err) {
        logger.error('Email send failed:', err.message);
        // Don't re-throw - let Agenda consider the job done even if email fails (non-critical)
      }
    }
  );
};
