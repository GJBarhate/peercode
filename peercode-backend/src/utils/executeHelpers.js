'use strict';

const LANGUAGE_MAP = {
  javascript: 93, js: 93,
  python: 71, py: 71, python3: 71,
  java: 62,
  cpp: 54, 'c++': 54,
  c: 50,
  typescript: 74, ts: 74
};

function getLanguageId(lang) {
  const id = LANGUAGE_MAP[lang?.toLowerCase()];
  if (!id) throw new Error(`Unsupported language: ${lang}`);
  return id;
}

function extractFunctionName(starterCode, language) {
  if (!starterCode) return null;
  const code = starterCode[language] || starterCode.javascript || '';
  if (language === 'javascript' || language === 'typescript') {
    const patterns = [
      /function\s+(\w+)\s*\(/,
      /(?:var|const|let)\s+(\w+)\s*=\s*function\s*\(/,
      /(?:var|const|let)\s+(\w+)\s*=\s*\([^)]*\)\s*=>/,
      /(?:var|const|let)\s+(\w+)\s*=\s*async\s*\(/,
    ];
    for (const p of patterns) { const m = code.match(p); if (m) return m[1]; }
  }
  if (language === 'python' || language === 'py' || language === 'python3') {
    const classMatch = code.match(/class\s+Solution\s*:/);
    if (classMatch) { const m = code.match(/def\s+(\w+)\s*\(/); if (m) return m[1]; }
    const m = code.match(/def\s+(\w+)\s*\(/); if (m) return m[1];
  }
  if (language === 'java') {
    const m = code.match(/public\s+(?:static\s+)?\w+\s+(\w+)\s*\(/); if (m) return m[1];
  }
  if (language === 'cpp' || language === 'c++') {
    const m = code.match(/(\w+)\s*\([^)]*\)\s*(?:const\s*)?\{/); if (m) return m[1];
  }
  if (language === 'c') {
    const m = code.match(/(\w+)\s*\([^)]*\)\s*\{/); if (m) return m[1];
  }
  return null;
}

function wrapCodeForTest(code, language, functionName, hasSolutionClass) {
  const langId = getLanguageId(language);
  const fnName = functionName || 'solution';

  if (langId === 93) {
    return `
${code}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();

try {
  let args;
  try { args = input ? JSON.parse(input) : []; }
  catch { args = input ? input.split('\\n').map(l=>l.trim()).filter(l=>l).map(l=>{try{return JSON.parse(l);}catch{return isNaN(l)?l:Number(l);}}) : []; }
  const result = ${fnName}(...args);
  console.log(JSON.stringify(result));
} catch (e) { console.error(e.message); process.exit(1); }
`;
  }
  if (langId === 71) {
    return `
${code}

import json, sys

try:
    input_data = sys.stdin.read().strip()
    if '\\n' in input_data:
        lines = [line.strip() for line in input_data.split('\\n') if line.strip()]
        args = []
        for line in lines:
            try: args.append(json.loads(line))
            except: args.append(line)
    else:
        try: args = [json.loads(input_data)]
        except: args = [input_data] if input_data else []
    
    ${hasSolutionClass ? `sol = Solution(); result = getattr(sol, '${fnName}')(*args)` : `result = ${fnName}(*args)`}
    print(json.dumps(result))
except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)
`;
  }
  if (langId === 62) {
    return `
import java.util.*; import java.io.*;

${code}

public class Main {
  public static void main(String[] args) {
    try {
      StringBuilder input = new StringBuilder();
      BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
      String line; while ((line = reader.readLine()) != null) { input.append(line).append("\\n"); }
      Solution sol = new Solution();
      System.out.println("Java test harness needs problem-specific implementation");
    } catch (Exception e) { System.err.println(e.getMessage()); System.exit(1); }
  }
}
`;
  }
  if (langId === 54) {
    return `
#include <bits/stdc++.h>
using namespace std;

${code}

int main() { return 0; }
`;
  }
  if (langId === 50) {
    return `
#include <stdio.h> #include <stdlib.h> #include <string.h>

${code}

int main() { return 0; }
`;
  }
  if (langId === 74) {
    return `
${code}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
try {
  let args; try { args = input ? JSON.parse(input) : []; }
  catch { args = input ? input.split('\\n').map(l=>l.trim()).filter(l=>l).map(l=>{try{return JSON.parse(l);}catch{return isNaN(l)?l:Number(l);}}) : []; }
  const result = ${fnName}(...args); console.log(JSON.stringify(result));
} catch (e) { console.error(e.message); process.exit(1); }
`;
  }
  return code;
}

module.exports = { getLanguageId, extractFunctionName, wrapCodeForTest };
