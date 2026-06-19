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

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const GEMINI_LIST_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';

// Fisher-Yates shuffle (uniform distribution, unlike Math.random()-0.5)
function fisherYatesShuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function callGemini(prompt, userApiKey = null) {
  if (userApiKey) return _callWithKey(prompt, userApiKey);
  if (POOL.length === 0) throw new Error('No Gemini API keys configured');
  const shuffled = fisherYatesShuffle(POOL);
  let lastError = null;
  for (const key of shuffled) {
    try {
      return await _callWithKey(prompt, key);
    } catch (err) {
      lastError = err;
      if (err.status === 429 || err._authError) continue;
      throw err;
    }
  }
  if (lastError?._authError) {
    throw new Error('All Gemini API keys are invalid. Please update GEMINI_KEY_1..7 in your .env file with valid API keys.');
  }
  throw new Error('All Gemini API keys quota exceeded. Try again later.');
}

async function _callWithKey(prompt, key) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let detail = body ? body.substring(0, 200) : res.statusText;
    const err = new Error('Gemini API error (' + res.status + '): ' + detail);
    err.status = res.status;
    // Mark invalid key errors so pool can try next key
    if (res.status === 400 || res.status === 403 || res.status === 401) {
      err._authError = true;
    }
    throw err;
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

function getKeyPoolStatus() {
  return { totalKeys: POOL.length };
}

async function validateKey(apiKey) {
  try {
    const res = await fetch(GEMINI_LIST_URL, {
      method: 'GET',
      headers: { 'x-goog-api-key': apiKey },
    });
    if (res.ok) return { valid: true, message: 'Key is valid' };
    return { valid: false, message: 'Key rejected by Google' };
  } catch {
    return { valid: false, message: 'Network error' };
  }
}

module.exports = { callGemini, getKeyPoolStatus, validateKey };
