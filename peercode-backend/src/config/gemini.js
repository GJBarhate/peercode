'use strict';

const POOL = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
  process.env.GEMINI_KEY_6,
  process.env.GEMINI_KEY_7,
].filter(Boolean);

let idx = 0;

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

async function callGemini(prompt, userApiKey = null) {
  if (userApiKey) return _callWithKey(prompt, userApiKey);
  if (POOL.length === 0) throw new Error('No Gemini API keys configured');
  const start = idx;
  for (let i = 0; i < POOL.length; i++) {
    const key = POOL[(start + i) % POOL.length];
    try {
      const result = await _callWithKey(prompt, key);
      idx = (start + i) % POOL.length;
      return result;
    } catch (err) {
      if (err.status === 429) continue;
      throw err;
    }
  }
  throw new Error('All Gemini API keys quota exceeded. Try again later.');
}

async function _callWithKey(prompt, key) {
  const res = await fetch(GEMINI_URL + '?key=' + key, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    const err = new Error('Gemini API error: ' + res.statusText);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function getKeyPoolStatus() {
  return { totalKeys: POOL.length, currentIndex: idx };
}

async function validateKey(apiKey) {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey, { method: 'GET' });
    if (res.ok) return { valid: true, message: 'Key is valid' };
    return { valid: false, message: 'Key rejected by Google' };
  } catch {
    return { valid: false, message: 'Network error' };
  }
}

module.exports = { callGemini, getKeyPoolStatus, validateKey };
