'use strict';

const isProduction = process.env.NODE_ENV === 'production';

function serialize(arg) {
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
  }
  if (typeof arg === 'object' && arg !== null) {
    try { return JSON.stringify(arg, getCircularReplacer()); } catch { return Object.prototype.toString.call(arg); }
  }
  return String(arg);
}

function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  };
}

function formatMessage(level, args) {
  const timestamp = new Date().toISOString();
  const message = args.map(serialize).join(' ');
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
