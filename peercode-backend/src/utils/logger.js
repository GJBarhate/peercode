'use strict';

const isProduction = process.env.NODE_ENV === 'production';

function formatMessage(level, args) {
  const timestamp = new Date().toISOString();
  const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

module.exports = {
  info: (...args) => {
    if (!isProduction) {
      console.log(formatMessage('info', args));
    }
  },
  debug: (...args) => {
    if (!isProduction) {
      console.debug(formatMessage('debug', args));
    }
  },
  warn: (...args) => console.warn(formatMessage('warn', args)),
  error: (...args) => console.error(formatMessage('error', args)),
};
