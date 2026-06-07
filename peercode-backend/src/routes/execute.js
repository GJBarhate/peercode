'use strict';

const express = require('express');
const router = express.Router();
const { executeLimiter } = require('../middleware/rateLimiter');
const { executeCode, simpleExecute, getProblemTestCases, addTestCase, deleteTestCase } = require('../controllers/executeController');
const auth = require('../middleware/auth');

// POST /api/execute - run with test cases
router.post('/', executeLimiter, executeCode);

// POST /api/execute/run - simple run with stdin (no test cases needed)
router.post('/run', executeLimiter, simpleExecute);

// Test case endpoints
router.get('/testcases/:problemId', getProblemTestCases);
router.post('/testcases/:problemId', auth, addTestCase);
router.delete('/testcases/:problemId/:tcId', auth, deleteTestCase);

module.exports = router;
