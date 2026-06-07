'use strict';

const axios = require('axios');
const logger = require('./logger');

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

// Map frontend language names to Piston language names
const LANGUAGE_MAP = {
  javascript: 'javascript',
  js: 'javascript',
  python: 'python',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  'c++': 'cpp',
  c: 'c',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  php: 'php',
  swift: 'swift',
  kotlin: 'kotlin',
  typescript: 'typescript',
  ts: 'typescript'
};

function getLanguage(lang) {
  return LANGUAGE_MAP[lang?.toLowerCase()] || lang;
}

// Wrap code to handle stdin for each language
function wrapCode(code, input, language) {
  const lang = getLanguage(language);
  
  switch (lang) {
    case 'javascript': {
      return `
const lines = \`${input.replace(/`/g, '\\`')}\`.trim().split('\\n');
let lineIndex = 0;
const readline = () => lines[lineIndex++] || '';
const readInt = () => parseInt(readline());
const readInts = () => readline().split(' ').map(Number);

${code}
`;
    }

    case 'python': {
      return `
import sys
lines = """${input.replace(/"""/g, '\\"\\"\\"')}""".strip().split('\\n')
line_index = 0

def readline():
    global line_index
    if line_index < len(lines):
        result = lines[line_index]
        line_index += 1
        return result
    return ''

def read_int():
    return int(readline())

def read_ints():
    return list(map(int, readline().split()))

${code}
`;
    }

    case 'java': {
      return `
import java.util.*;
import java.io.*;

class Solution {
    static String[] lines = \`${input.replace(/`/g, '\\`')}\`.trim().split("\\n");
    static int lineIndex = 0;
    
    static String readline() {
        return lineIndex < lines.length ? lines[lineIndex++] : "";
    }
    
    static int readInt() {
        return Integer.parseInt(readline());
    }
    
    static int[] readInts() {
        return Arrays.stream(readline().split(" ")).mapToInt(Integer::parseInt).toArray();
    }
    
    ${code.replace(/^(public\s+static\s+void\s+main|class\s+\w+)/, 'public static void main')}
}
`;
    }

    case 'cpp': {
      return `
#include <bits/stdc++.h>
using namespace std;

string lines[] = {${input.split('\n').map(line => `"${line.replace(/"/g, '\\"')}"`).join(', ')}};
int lineIndex = 0;

string readline() {
    return lineIndex < ${input.split('\n').length} ? lines[lineIndex++] : "";
}

int readInt() {
    return stoi(readline());
}

${code}
`;
    }

    default:
      return code;
  }
}

async function executeCode(code, language, testCases) {
  const lang = getLanguage(language);
  
  if (!lang) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const wrappedCode = wrapCode(code, testCase.input, lang);

    try {
      const startTime = Date.now();
      const response = await axios.post(PISTON_URL, {
        language: lang,
        version: '*',
        files: [{ content: wrappedCode }],
        stdin: testCase.input,
        compile_timeout: 10000,
        run_timeout: 5000,
        compile_memory_limit: -1,
        run_memory_limit: -1
      }, { timeout: 15000 });

      const executionTime = Date.now() - startTime;
      const actualOutput = (response.data.run?.stdout || '').trim();
      const expectedOutput = (testCase.expectedOutput || '').trim();
      const passed = actualOutput === expectedOutput;

      results.push({
        index: i,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: actualOutput,
        passed,
        executionTime,
        error: response.data.run?.stderr || null
      });
    } catch (err) {
      logger.error(`Execution error for test case ${i}:`, err.message);
      results.push({
        index: i,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: '',
        passed: false,
        executionTime: 0,
        error: err.message || 'Execution failed'
      });
    }
  }

  const passedCount = results.filter(r => r.passed).length;

  return {
    results,
    allPassed: passedCount === results.length && results.length > 0,
    passedCount,
    totalCount: results.length
  };
}

module.exports = { executeCode };
