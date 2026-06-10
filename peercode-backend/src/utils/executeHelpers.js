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
    py: [/def\s+(\w+)\s*\(/, /class\s+Solution\s*:/],
    python3: [/def\s+(\w+)\s*\(/, /class\s+Solution\s*:/],
    java: [/public\s+(?:static\s+)?\w+\s+(\w+)\s*\(/],
    cpp: [/(\w+)\s*\([^)]*\)\s*(?:const\s*)?\{/],
    'c++': [/(\w+)\s*\([^)]*\)\s*(?:const\s*)?\{/],
    c: [/(\w+)\s*\([^)]*\)\s*\{/],
    go: [/func\s+(\w+)\s*\(/],
  };
  const langPatterns = patterns[language] || patterns.javascript;
  for (const p of langPatterns) {
    const m = code.match(p);
    if (m) return m[1];
    // For Python, if we found 'class Solution', look for method
    if (language === 'python' || language === 'py' || language === 'python3') {
      if (m && m[0].includes('class Solution')) {
        const methodMatch = code.match(/def\s+(\w+)\s*\(self/);
        if (methodMatch) return methodMatch[1];
      }
    }
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
  catch { args = input.split('\\n').map(l=>l.trim()).filter(l=>l).map(l=>{try{return JSON.parse(l);}catch{return isNaN(l)?l:Number(l);}}); }
  if (!Array.isArray(args)) args = [args];
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
    if input_data:
        try: args = json.loads(input_data)
        except:
            if '\\n' in input_data:
                args = []
                for line in input_data.split('\\n'):
                    line = line.strip()
                    if line:
                        try: args.append(json.loads(line))
                        except: args.append(line)
            else:
                args = [input_data]
        if not isinstance(args, list): args = [args]
    else:
        args = []
    ${hasSolutionClass ? `sol = Solution(); result = getattr(sol, '${fnName}')(*args)` : `result = ${fnName}(*args)`}
    print(json.dumps(result))
except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)
`;
  }
  if (langId === 62) {
    return `
import java.util.*;
import java.io.*;

public class Main {
  public static void main(String[] args) {
    try {
      StringBuilder sb = new StringBuilder();
      BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
      String line;
      while ((line = reader.readLine()) != null) sb.append(line);
      String input = sb.toString().trim();
      Object result;
      if (input.isEmpty()) {
        result = new ${hasSolutionClass ? 'Solution().' + fnName + '()' : fnName + '()'};
      } else {
        try {
          org.json.JSONArray jsonArgs = new org.json.JSONArray(input);
          Object[] callArgs = new Object[jsonArgs.length()];
          for (int i = 0; i < jsonArgs.length(); i++) {
            Object val = jsonArgs.get(i);
            if (val instanceof org.json.JSONArray) {
              java.util.List<Object> list = new ArrayList<>();
              for (int j = 0; j < ((org.json.JSONArray)val).length(); j++) list.add(((org.json.JSONArray)val).get(j));
              callArgs[i] = list;
            } else { callArgs[i] = val; }
          }
          result = ${hasSolutionClass ? 'new Solution().' + fnName : fnName}(callArgs);
        } catch (Exception e) {
          String[] parts = input.split("\\n");
          result = ${hasSolutionClass ? 'new Solution().' + fnName : fnName}((Object)parts);
        }
      }
      if (result != null) System.out.println(result.toString());
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

int main() {
  ios::sync_with_stdio(false); cin.tie(nullptr);
  string input, line;
  while (getline(cin, line)) input += line;
  if (input.empty()) { ${fnName}(); return 0; }
  try {
    auto result = ${fnName}(input);
    cout << result << endl;
  } catch (...) { cerr << "Error executing " << "${fnName}" << endl; return 1; }
  return 0;
}
`;
  }
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
  ${fnName}(input);
  return 0;
}
`;
  }
  if (langId === 74) {
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
  if (langId === 106) {
    return `
package main

import (
  "bufio"
  "encoding/json"
  "fmt"
  "os"
  "reflect"
)

${code}

func main() {
  scanner := bufio.NewScanner(os.Stdin)
  var input string
  for scanner.Scan() { input += scanner.Text() }
  if input == "" { ${fnName}(); return }
  ${fnName}(input)
}
`;
  }
  return code;
}

function buildCodeFromHarness(problem, language, userCode, testInput) {
  const harness = problem?.testHarness?.[language];
  if (!harness) return null;

  let code = harness;

  const userCodePlaceholders = ['// __USER_CODE__', '# __USER_CODE__', '__USER_CODE__', '// USER_CODE_HERE', 'USER_CODE_HERE'];
  for (const placeholder of userCodePlaceholders) {
    if (code.includes(placeholder)) {
      code = code.replace(placeholder, userCode);
      break;
    }
  }

  let escapedInput = testInput;
  if (language === 'java' || language === 'cpp') {
    escapedInput = escapedInput
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r\n/g, '\\n')
      .replace(/\r/g, '\\n')
      .replace(/\n/g, '\\n');
  }

  code = code.replace(/__TEST_INPUT__/g, escapedInput);

  return code;
}

module.exports = { getLanguageId, extractFunctionName, wrapCodeForTest, buildCodeFromHarness };
