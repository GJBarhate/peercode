'use strict';

const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB per file

if (isProduction) {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) {}
}

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

function rotateIfNeeded(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_LOG_SIZE) {
      const rotated = filePath.replace('.log', `-${Date.now()}.log`);
      fs.renameSync(filePath, rotated);
    }
  } catch (_) {}
}

function writeToFile(level, formatted) {
  if (!isProduction) return;
  try {
    const file = level === 'error'
      ? path.join(LOG_DIR, 'error.log')
      : path.join(LOG_DIR, 'combined.log');
    rotateIfNeeded(file);
    fs.appendFileSync(file, formatted + '\n');
    if (level === 'error') {
      const combined = path.join(LOG_DIR, 'combined.log');
      rotateIfNeeded(combined);
      fs.appendFileSync(combined, formatted + '\n');
    }
  } catch (_) {}
}

module.exports = {
  info: (...args) => {
    const msg = formatMessage('info', args);
    if (!isProduction) console.log(msg);
    writeToFile('info', msg);
  },
  debug: (...args) => {
    if (isProduction) return;
    console.debug(formatMessage('debug', args));
  },
  warn: (...args) => {
    const msg = formatMessage('warn', args);
    console.warn(msg);
    writeToFile('warn', msg);
  },
  error: (...args) => {
    const msg = formatMessage('error', args);
    console.error(msg);
    writeToFile('error', msg);
  },
};
