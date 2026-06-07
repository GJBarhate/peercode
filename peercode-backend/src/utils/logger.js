'use strict';

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  info: (...args) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  debug: (...args) => {
    if (!isProduction) {
      console.debug(...args);
    }
  },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};
