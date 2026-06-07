'use strict';

const { validateKey } = require('../config/gemini');
const { ok: success, fail } = require('../utils/httpResponse');

async function validateGeminiKey(req, res) {
  const apiKey = typeof req.body.apiKey === 'string' ? req.body.apiKey.trim() : '';

  if (!apiKey) {
    return fail(res, 400, 'API key is required');
  }

  const result = await validateKey(apiKey);

  if (result.valid) {
    return success(res, { valid: true, message: result.message }, result.message);
  } else {
    return fail(res, 400, result.message || 'Invalid API key');
  }
}

module.exports = { validateGeminiKey };