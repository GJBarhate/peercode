'use strict';

const LANGUAGE_MAP = {
  javascript: 93, js: 93,
  python: 71, py: 71, python3: 71,
  java: 62,
  cpp: 54, 'c++': 54,
  c: 50,
  typescript: 74, ts: 74,
  go: 106, golang: 106
};

const KNOWN_FUNCTIONS = {
  'two-sum': 'twoSum',
  'valid-parentheses': 'isValid',
  'best-time-to-buy-and-sell-stock': 'maxProfit',
  'maximum-subarray': 'maxSubArray',
  'number-of-islands': 'numIslands',
  'merge-intervals': 'merge',
  'coin-change': 'coinChange',
  'word-break': 'wordBreak',
  'binary-tree-level-order-traversal': 'levelOrder',
  'lru-cache': 'LRUCache',
  'house-robber': 'rob',
  'longest-substring-without-repeating-characters': 'lengthOfLongestSubstring',
  'container-with-most-water': 'maxArea',
  '3sum': 'threeSum',
  'serialize-and-deserialize-binary-tree': 'serialize',
  'climbing-stairs': 'climbStairs',
  'palindromic-substrings': 'countSubstrings',
  'course-schedule': 'canFinish',
  'trapping-rain-water': 'trap',
  'pacific-atlantic-water-flow': 'pacificAtlantic',
  'decode-ways': 'numDecodings',
  'rotate-image': 'rotate',
  'word-ladder': 'ladderLength',
};

function getLanguageId(lang) {
  const id = LANGUAGE_MAP[lang?.toLowerCase()];
  if (!id) throw new Error(`Unsupported language: ${lang}`);
  return id;
}

function extractFunctionName(starterCode, language) {
  if (!starterCode) return null;
  const code = starterCode[language] || starterCode.javascript || '';
  if (!code) return null;
  const patterns = {
    javascript: [/function\s+(\w+)\s*\(/, /(?:var|const|let)\s+(\w+)\s*=\s*(?:function\s*\(|\([^)]*\)\s*=>|async\s*\()/],
    typescript: [/function\s+(\w+)\s*\(/, /(?:var|const|let)\s+(\w+)\s*=\s*(?:function\s*\(|\([^)]*\)\s*=>|async\s*\()/],
    python: [/def\s+(\w+)\s*\(/, /class\s+Solution\s*:/],
    java: [/public\s+(?:static\s+)?\w+\s+(\w+)\s*\(/],
    cpp: [/(\w+)\s*\([^)]*\)\s*(?:const\s*)?\{/],
    go: [/func\s+(\w+)\s*\(/],
  };
  const ps = patterns[language] || patterns.javascript;
  for (const p of ps) {
    const m = code.match(p);
    if (m) { if (m[1]) return m[1]; }
  }
  return null;
}

function wrapCodeForTest(code, language, functionName, hasSolutionClass) {
  const langId = getLanguageId(language);
  const fnName = functionName || 'solution';

  // ── JavaScript / TypeScript ────────────────────────────
  if (langId === 93 || langId === 74) {
    return `
${code}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
try {
  let args;
  try { args = input ? JSON.parse(input) : []; }
  catch { args = input.split('\\n').map(l=>l.trim()).filter(l=>l).map(l=>{try{return JSON.parse(l);}catch{return isNaN(l)?l:Number(l);}}); }
  if (!Array.isArray(args)) args = [args];
  const result = ${fnName}(...args);
  console.log(JSON.stringify(result));
} catch (e) { console.error(e.message); process.exit(1); }
`;
  }

  // ── Python ─────────────────────────────────────────────
  if (langId === 71) {
    return `
${code}

import json, sys

try:
    input_data = sys.stdin.read().strip()
    if input_data:
        try: args = json.loads(input_data)
        except:
            if '\\n' in input_data:
                args = [line.strip() for line in input_data.split('\\n') if line.strip()]
            else:
                args = [input_data]
        if not isinstance(args, list): args = [args]
    else:
        args = []
    ${hasSolutionClass ? `sol = Solution(); result = sol.${fnName}(*args)` : `result = ${fnName}(*args)`}
    print(json.dumps(result))
except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)
`;
  }

  // ── Java ───────────────────────────────────────────────
  if (langId === 62) {
    return `
import java.util.*;
import java.io.*;

public class Main {
  public static String solve(String input) throws Exception {
    StringBuilder sb = new StringBuilder();
    BufferedReader r = new BufferedReader(new InputStreamReader(System.in));
    String l; while ((l = r.readLine()) != null) sb.append(l);
    String data = sb.toString().trim();
    ${hasSolutionClass ? `return String.valueOf(new Solution().${fnName}(data));` : `return String.valueOf(${fnName}(data));`}
  }

  public static void main(String[] args) {
    try { System.out.println(solve("")); }
    catch (Exception e) { System.err.println(e.getMessage()); System.exit(1); }
  }
}
`;
  }

  // ── C++ ────────────────────────────────────────────────
  if (langId === 54) {
    return `
#include <bits/stdc++.h>
using namespace std;

${code}

int main() {
  ios::sync_with_stdio(false); cin.tie(nullptr);
  string input, line;
  while (getline(cin, line)) input += line;
  auto result = ${fnName}(input);
  cout << result << endl;
  return 0;
}
`;
  }

  // ── C ─────────────────────────────────────────────────
  if (langId === 50) {
    return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${code}

int main() {
  char input[100000] = {0};
  size_t total = 0;
  char buffer[4096];
  while (fgets(buffer, sizeof(buffer), stdin)) {
    size_t len = strlen(buffer);
    if (total + len < sizeof(input)) { memcpy(input + total, buffer, len); total += len; }
  }
  char* result = ${fnName}(input);
  if (result) printf("%s", result);
  return 0;
}
`;
  }

  // ── Go ─────────────────────────────────────────────────
  if (langId === 106) {
    return `
package main

import (
  "bufio"
  "fmt"
  "os"
)

${code}

func main() {
  scanner := bufio.NewScanner(os.Stdin)
  var input string
  for scanner.Scan() { input += scanner.Text() }
  fmt.Print(${fnName}(input))
}
`;
  }

  return code;
}

function buildCodeFromHarness(problem, language, userCode, testInput) {
  const harness = problem?.testHarness?.[language];
  if (!harness) return null;
  let code = harness;
  const placeholders = ['// __USER_CODE__', '# __USER_CODE__', '__USER_CODE__', '// USER_CODE_HERE', 'USER_CODE_HERE'];
  for (const ph of placeholders) {
    if (code.includes(ph)) { code = code.replace(ph, userCode); break; }
  }
  let escaped = testInput;
  if (language === 'java' || language === 'cpp') {
    escaped = escaped.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r\n/g, '\\n').replace(/\r/g, '\\n').replace(/\n/g, '\\n');
  }
  code = code.replace(/__TEST_INPUT__/g, escaped);
  return code;
}

module.exports = { getLanguageId, extractFunctionName, wrapCodeForTest, buildCodeFromHarness };
