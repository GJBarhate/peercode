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
    if (m && m[1]) return m[1];
  }
  return null;
}

// ── Minimal JSON parser for Java (embedded below) ──────
const JAVA_JSON_PARSER = `
import java.util.*;
import java.lang.reflect.*;

class JsonVal {
  Object val; int type; // 0=null,1=bool,2=num,3=str,4=arr,5=map
  JsonVal(Object v, int t) { val = v; type = t; }
  boolean isArr() { return type == 4; }
  List<JsonVal> asArr() { return (List<JsonVal>)val; }
  String asStr() { return (String)val; }
  double asNum() { return ((Number)val).doubleValue(); }
  boolean asBool() { return (Boolean)val; }
}

class JsonParser {
  String s; int i;
  JsonParser(String src) { s = src.trim(); i = 0; }
  JsonVal parse() { JsonVal v = parseVal(); return v; }
  char peek() { while (i < s.length() && s.charAt(i) <= ' ') i++; return i < s.length() ? s.charAt(i) : 0; }
  char next() { char c = peek(); if (c != 0) i++; return c; }
  JsonVal parseVal() {
    char c = peek();
    if (c == 'n') { expect("null"); return new JsonVal(null, 0); }
    if (c == 't') { expect("true"); return new JsonVal(true, 1); }
    if (c == 'f') { expect("false"); return new JsonVal(false, 1); }
    if (c == '"') return new JsonVal(parseStr(), 3);
    if (c == '[') return parseArr();
    if (c == '-' || (c >= '0' && c <= '9')) return parseNum();
    if (c == '{') return parseMap();
    throw new RuntimeException("Unexpected: " + c);
  }
  void expect(String lit) { for (char c : lit.toCharArray()) if (next() != c) throw new RuntimeException("Expected " + lit); }
  String parseStr() {
    next(); // skip "
    StringBuilder sb = new StringBuilder();
    while (i < s.length() && s.charAt(i) != '"') {
      if (s.charAt(i) == '\\\\' && i + 1 < s.length()) { i++; sb.append(s.charAt(i) == 'n' ? '\\n' : s.charAt(i)); }
      else sb.append(s.charAt(i));
      i++;
    }
    if (i < s.length()) i++; // skip closing "
    return sb.toString();
  }
  JsonVal parseNum() {
    int start = i;
    if (s.charAt(i) == '-') i++;
    while (i < s.length() && s.charAt(i) >= '0' && s.charAt(i) <= '9') i++;
    boolean isDouble = false;
    if (i < s.length() && s.charAt(i) == '.') { isDouble = true; i++; while (i < s.length() && s.charAt(i) >= '0' && s.charAt(i) <= '9') i++; }
    String num = s.substring(start, i);
    return new JsonVal(isDouble ? Double.parseDouble(num) : Long.parseLong(num), 2);
  }
  JsonVal parseArr() {
    next(); // skip [
    List<JsonVal> arr = new ArrayList<>();
    while (peek() != 0 && peek() != ']') {
      if (!arr.isEmpty()) next(); // skip comma
      arr.add(parseVal());
    }
    if (peek() == ']') next();
    return new JsonVal(arr, 4);
  }
  JsonVal parseMap() {
    next(); // skip {
    Map<String, JsonVal> map = new LinkedHashMap<>();
    while (peek() != 0 && peek() != '}') {
      if (!map.isEmpty()) next();
      String key = parseStr();
      next(); // skip :
      map.put(key, parseVal());
    }
    if (peek() == '}') next();
    return new JsonVal(map, 5);
  }
}
`;

function generateJavaWrapper(fnName) {
  return `
import java.util.*;
import java.io.*;
import java.lang.reflect.*;
${JAVA_JSON_PARSER}

public class Main {
  public static void main(String[] args) throws Exception {
    StringBuilder sb = new StringBuilder();
    BufferedReader r = new BufferedReader(new InputStreamReader(System.in));
    String l; while ((l = r.readLine()) != null) sb.append(l);
    String input = sb.toString().trim();

    // Parse input as JSON array of arguments
    Object[] callArgs = new Object[0];
    if (!input.isEmpty()) {
      JsonVal parsed = new JsonParser(input).parse();
      if (parsed.isArr()) {
        List<JsonVal> argList = parsed.asArr();
        callArgs = new Object[argList.size()];
        for (int i = 0; i < argList.size(); i++) {
          callArgs[i] = toJavaObject(argList.get(i));
        }
      } else {
        callArgs = new Object[]{ toJavaObject(parsed) };
      }
    }

    // Call Solution.${fnName} via reflection
    Class<?> clazz = Class.forName("Solution");
    Method method = findMethod(clazz, "${fnName}", callArgs.length);
    Object result = method.invoke(clazz.getDeclaredConstructor().newInstance(), callArgs);
    System.out.println(toJsonString(result));
  }

  static Method findMethod(Class<?> clazz, String name, int paramCount) {
    for (Method m : clazz.getDeclaredMethods()) {
      if (m.getName().equals(name) && m.getParameterCount() == paramCount) return m;
    }
    throw new RuntimeException("Method " + name + " with " + paramCount + " params not found in Solution class");
  }

  static Object toJavaObject(JsonVal jv) {
    if (jv == null || jv.type == 0) return null;
    if (jv.type == 1) return jv.asBool();
    if (jv.type == 3) return jv.asStr();
    if (jv.type == 2) {
      double d = jv.asNum();
      if (d == Math.floor(d) && !Double.isInfinite(d)) return (int)(long)d;
      return d;
    }
    if (jv.type == 4) {
      List<JsonVal> arr = jv.asArr();
      if (arr.isEmpty()) return new int[0];
      // Check if it's a 2D array
      if (arr.get(0).isArr()) {
        List<Object> rows = new ArrayList<>();
        for (JsonVal row : arr) {
          List<JsonVal> rowArr = row.asArr();
          // Detect type from first element
          if (!rowArr.isEmpty() && rowArr.get(0).type == 3) {
            char[][] result = new char[arr.size()][];
            for (int i2 = 0; i2 < arr.size(); i2++) {
              List<JsonVal> ra = arr.get(i2).asArr();
              result[i2] = new char[ra.size()];
              for (int j2 = 0; j2 < ra.size(); j2++) result[i2][j2] = ra.get(j2).asStr().charAt(0);
            }
            return result;
          } else {
            int[][] result = new int[arr.size()][];
            for (int i2 = 0; i2 < arr.size(); i2++) {
              List<JsonVal> ra = arr.get(i2).asArr();
              result[i2] = new int[ra.size()];
              for (int j2 = 0; j2 < ra.size(); j2++) result[i2][j2] = (int)ra.get(j2).asNum();
            }
            return result;
          }
        }
      }
      // 1D array
      if (!arr.isEmpty() && arr.get(0).type == 3) {
        String[] result = new String[arr.size()];
        for (int i2 = 0; i2 < arr.size(); i2++) result[i2] = arr.get(i2).asStr();
        return result;
      }
      if (!arr.isEmpty() && arr.get(0).type == 1) {
        boolean[] result = new boolean[arr.size()];
        for (int i2 = 0; i2 < arr.size(); i2++) result[i2] = arr.get(i2).asBool();
        return result;
      }
      int[] result = new int[arr.size()];
      for (int i2 = 0; i2 < arr.size(); i2++) result[i2] = (int)arr.get(i2).asNum();
      return result;
    }
    return null;
  }

  @SuppressWarnings("unchecked")
  static String toJsonString(Object obj) {
    if (obj == null) return "null";
    if (obj instanceof String) return "\\"" + escapeJson((String)obj) + "\\"";
    if (obj instanceof Boolean || obj instanceof Number) return obj.toString();
    if (obj instanceof int[]) { int[] ia = (int[])obj; StringBuilder sb = new StringBuilder("["); for (int i = 0; i < ia.length; i++) { if (i > 0) sb.append(","); sb.append(ia[i]); } return sb.append("]").toString(); }
    if (obj instanceof char[][]) {
      StringBuilder sb = new StringBuilder("[");
      for (char[] row : (char[][])obj) {
        sb.append(sb.length()>1?",":"["); sb.append("\\"");
        sb.append(escapeJson(new String(row)));
        sb.append("\\"]");
      }
      return sb.append("]").toString();
    }
    if (obj instanceof int[][]) {
      StringBuilder sb = new StringBuilder("[");
      for (int[] row : (int[][])obj) {
        sb.append(sb.length()>1?",":"[");
        for (int v : row) sb.append(sb.charAt(sb.length()-1)=='['?"":",").append(v);
        sb.append("]");
      }
      return sb.append("]").toString();
    }
    if (obj instanceof List) {
      List<Object> list = (List<Object>)obj;
      StringBuilder sb = new StringBuilder("[");
      for (int i2 = 0; i2 < list.size(); i2++) {
        if (i2 > 0) sb.append(",");
        sb.append(toJsonString(list.get(i2)));
      }
      return sb.append("]").toString();
    }
    if (obj instanceof String[]) {
      StringBuilder sb = new StringBuilder("[");
      for (String s2 : (String[])obj) sb.append(sb.length()>1?",":"\\"").append(escapeJson(s2)).append("\\"");
      return sb.append("]").toString();
    }
    return String.valueOf(obj);
  }

  static String escapeJson(String s) {
    return s.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"");
  }
}
`;
}

function wrapDesignProblem(code, language, langId) {
  // Class-based problems: LRU Cache, Serialize/Deserialize Binary Tree, etc.
  // Input format: ["method1","method2",...]\n[[arg1],[arg2],...]
  // Output format: [result1, result2, ...]

  if (langId === 93 || langId === 74) { // JavaScript / TypeScript
    const tsPrefix = langId === 74
      ? 'declare var require: any;\ndeclare var process: any;\nexport {};\n\n'
      : '';
    return tsPrefix + code + `

const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
const lines = input.split('\\n');
const methods = JSON.parse(lines[0]);
const argsList = JSON.parse(lines[1]);
const obj = new LRUCache(...argsList[0]);
const results = [null];
for (let i = 1; i < methods.length; i++) {
  const result = obj[methods[i]](...argsList[i]);
  results.push(result !== undefined && result !== null ? result : null);
}
console.log(JSON.stringify(results));
`;
  }

  if (langId === 71) { // Python
    return code + `

import json, sys
input_data = sys.stdin.read().strip()
lines = input_data.split('\\n')
methods = json.loads(lines[0])
args = json.loads(lines[1])
obj = LRUCache(*args[0])
results = [None]
for i in range(1, len(methods)):
    result = getattr(obj, methods[i])(*args[i])
    results.append(result)
print(json.dumps(results))
`;
  }

  if (langId === 62) { // Java
    return `
import java.util.*;
import java.io.*;
import java.lang.reflect.*;

${code}

public class Main {
  public static void main(String[] args) throws Exception {
    StringBuilder sb = new StringBuilder();
    BufferedReader r = new BufferedReader(new InputStreamReader(System.in));
    String l; while ((l = r.readLine()) != null) sb.append(l);
    String input = sb.toString().trim();
    String[] parts = input.split("\\n");
    String[] methods = new com.google.gson.Gson().fromJson(parts[0], String[].class);
    long[][] argsList = new com.google.gson.Gson().fromJson(parts[1], long[][].class);
    // Can't parse without JSON library, fallback to simple approach
    System.out.println("[]");
  }
}
`;
  }

  if (langId === 106) { // Go
    return `
package main

import (
  "bufio"
  "encoding/json"
  "fmt"
  "os"
  "strings"
)

${code}

func main() {
  scanner := bufio.NewScanner(os.Stdin)
  var input string
  for scanner.Scan() { input += scanner.Text() }

  parts := strings.SplitN(input, "\\n", 2)
  if len(parts) < 2 { fmt.Print("[]"); return }

  var methods []string
  json.Unmarshal([]byte(parts[0]), &methods)

  var rawArgs [][]json.Number
  json.Unmarshal([]byte(parts[1]), &rawArgs)

  cap := 0
  if num, err := rawArgs[0][0].Int64(); err == nil { cap = int(num) }
  cache := Constructor(cap)
  results := make([]interface{}, len(methods))
  results[0] = nil

  for i := 1; i < len(methods); i++ {
    switch methods[i] {
    case "put":
      key, _ := rawArgs[i][0].Int64()
      val, _ := rawArgs[i][1].Int64()
      cache.Put(int(key), int(val))
      results[i] = nil
    case "get":
      key, _ := rawArgs[i][0].Int64()
      results[i] = cache.Get(int(key))
    }
  }

  b, _ := json.Marshal(results)
  fmt.Print(string(b))
}
`;
  }

  if (langId === 54) { // C++
    return `
#include <bits/stdc++.h>
using namespace std;
${code}
int main() {
  string in, l; while (getline(cin, l)) in += l;
  cout << "[]" << endl;
  return 0;
}
`;
  }

  // Fallback for C
  return code;
}

function wrapCodeForTest(code, language, functionName, hasSolutionClass) {
  const langId = getLanguageId(language);
  const fnName = functionName || 'solution';

  // Special handling for class-based problems (LRU Cache, etc.)
  const isDesignProblem = code.includes('class LRUCache') || code.includes('type LRUCache struct');

  if (isDesignProblem) {
    return wrapDesignProblem(code, language, langId);
  }

  if (langId === 93 || langId === 74) {
    // TypeScript needs type declarations for Node.js APIs
    const tsPrefix = langId === 74
      ? 'declare var require: any;\ndeclare var process: any;\nexport {};\n\n'
      : '';
    const callPrefix = langId === 74 ? '(' + fnName + ' as any)' : fnName;
    return `
${tsPrefix}${code}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
try {
  let args;
  try { args = input ? JSON.parse(input) : []; }
  catch { args = input.split('\\n').map(l=>l.trim()).filter(l=>l).map(l=>{try{return JSON.parse(l);}catch{return isNaN(l)?l:Number(l);}}); }
  if (!Array.isArray(args)) args = [args];
  const result = ${callPrefix}(...args);
  console.log(JSON.stringify(result));
} catch (e) { console.error(e.message); process.exit(1); }
`;
  }

  if (langId === 71) {
    const hasSol = code.includes('class Solution');
    return `
from typing import List, Optional, Dict, Tuple
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
    ${hasSol ? `sol = Solution(); result = sol.${fnName}(*args)` : `result = ${fnName}(*args)`}
    print(json.dumps(result))
except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)
`;
  }

  if (langId === 62) {
    // Insert user's Solution class between imports and Main class
    const wrapper = generateJavaWrapper(fnName);
    const mainIdx = wrapper.indexOf('public class Main');
    return wrapper.substring(0, mainIdx) + '\n' + code + '\n' + wrapper.substring(mainIdx);
  }

  if (langId === 54) {
    return `
#include <bits/stdc++.h>
using namespace std;

// C++ JSON Parser
struct Json { int type; // 0=null 1=bool 2=num 3=str 4=arr
  bool b; long long n; double d; string s; vector<Json> arr;
  Json():type(0),b(0),n(0),d(0){}
  static Json parse(const string& src) { int i=0; return parseVal(src,i); }
  static void skipWS(const string& s, int& i) { while(i<(int)s.size()&&s[i]<=' ') i++; }
  static Json parseVal(const string& s, int& i) {
    skipWS(s,i); if(i>=(int)s.size()) return Json();
    char c=s[i];
    if(c=='n'){ i+=4; return Json(); }
    if(c=='t'){ i+=4; Json j; j.type=1; j.b=true; return j; }
    if(c=='f'){ i+=5; Json j; j.type=1; j.b=false; return j; }
    if(c=='"') return parseStr(s,i);
    if(c=='[') return parseArr(s,i);
    if(c=='-'||(c>='0'&&c<='9')) return parseNum(s,i);
    return Json();
  }
  static Json parseStr(const string& s, int& i) {
    i++; Json j; j.type=3;
    while(i<(int)s.size()&&s[i]!='"'){ if(s[i]=='\\\\'&&i+1<(int)s.size()){i++;j.s+=s[i]=='n'?'\\n':s[i];}else j.s+=s[i]; i++; }
    i++; return j;
  }
  static Json parseNum(const string& s, int& i) {
    Json j; j.type=2; int start=i;
    if(s[i]=='-') i++;
    while(i<(int)s.size()&&s[i]>='0'&&s[i]<='9') i++;
    if(i<(int)s.size()&&s[i]=='.'){ i++; while(i<(int)s.size()&&s[i]>='0'&&s[i]<='9') i++; j.d=stod(s.substr(start,i-start)); }
    else j.n=stoll(s.substr(start,i-start));
    return j;
  }
  static Json parseArr(const string& s, int& i) {
    i++; Json j; j.type=4;
    while(i<(int)s.size()&&s[i]!=']'){ if(!j.arr.empty()) i++; j.arr.push_back(parseVal(s,i)); skipWS(s,i); }
    if(i<(int)s.size()&&s[i]==']') i++;
    return j;
  }
  int asInt() const { return (int)(type==2?n:0); }
  long long asLong() const { return type==2?n:0; }
  string asStr() const { return type==3?s:""; }
  vector<int> asIntVec() const { vector<int> r; if(type==4) for(auto& v:arr) r.push_back(v.asInt()); return r; }
  vector<vector<int>> asIntVecVec() const { vector<vector<int>> r; if(type==4) for(auto& v:arr) r.push_back(v.asIntVec()); return r; }
  vector<vector<char>> asCharVecVec() const { vector<vector<char>> r; if(type==4) for(auto& v:arr){vector<char> row;for(auto& c:v.arr)row.push_back(c.asStr()[0]);r.push_back(row);} return r; }
  vector<string> asStrVec() const { vector<string> r; if(type==4) for(auto& v:arr) r.push_back(v.asStr()); return r; }
};

${code}

int main() {
  ios::sync_with_stdio(false); cin.tie(nullptr);
  string input, line;
  while (getline(cin, line)) input += line;
  auto json = Json::parse(input);
  Solution sol;

  // Call function with JSON-parsed args based on problem type
  auto result = [&]() -> string {
    if (json.type == 4 && json.arr.size() >= 1) {
      auto& args = json.arr;
      // Try 2D char array (numIslands)
      if (args[0].type == 4 && !args[0].arr.empty() && args[0].arr[0].type == 4 && args[0].arr[0].arr[0].type == 3) {
        auto val = sol.${fnName}(args[0].asCharVecVec());
        stringstream ss; ss << val; return ss.str();
      }
      // Try 2D int array (merge, threeSum, rotateImage)
      if (args[0].type == 4 && !args[0].arr.empty() && args[0].arr[0].type == 4) {
        if (args.size() == 1) {
          auto val = sol.${fnName}(args[0].asIntVecVec());
          stringstream ss; ss << val; return ss.str();
        }
        if (args.size() == 2) {
          auto val = sol.${fnName}(args[0].asIntVecVec(), args[1].asInt());
          stringstream ss; ss << val; return ss.str();
        }
      }
      // Try int array + int (coinChange, twoSum)
      if (args[0].type == 4 && args[0].arr[0].type == 2) {
        if (args.size() == 1) {
          auto val = sol.${fnName}(args[0].asIntVec());
          stringstream ss; ss << val; return ss.str();
        }
        if (args.size() == 2) {
          auto val = sol.${fnName}(args[0].asIntVec(), args[1].asInt());
          stringstream ss; ss << val; return ss.str();
        }
        if (args.size() == 3) {
          auto val = sol.${fnName}(args[0].asIntVec(), args[1].asInt(), args[2].asInt());
          stringstream ss; ss << val; return ss.str();
        }
      }
      // Try string + string array (wordBreak, ladderLength)
      if (args[0].type == 3 && args.size() >= 2 && args[1].type == 4) {
        auto val = sol.${fnName}(args[0].asStr(), args[1].asStrVec());
        stringstream ss; ss << val; return ss.str();
      }
      // Try string + string + string array (ladderLength with 3 params)
      if (args[0].type == 3 && args.size() >= 2 && args[1].type == 3) {
        if (args.size() == 2) {
          auto val = sol.${fnName}(args[0].asStr(), args[1].asStr());
          stringstream ss; ss << val; return ss.str();
        }
        if (args.size() == 3) {
          auto val = sol.${fnName}(args[0].asStr(), args[1].asStr(), args[2].asStrVec());
          stringstream ss; ss << val; return ss.str();
        }
      }
      // Try single string
      if (args[0].type == 3) {
        auto val = sol.${fnName}(args[0].asStr());
        stringstream ss; ss << val; return ss.str();
      }
      // Try single int (climbStairs)
      if (args[0].type == 2) {
        auto val = sol.${fnName}(args[0].asInt());
        stringstream ss; ss << val; return ss.str();
      }
    }
    auto val = sol.${fnName}();
    stringstream ss; ss << val; return ss.str();
  }();
  cout << result << endl;
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
  char* result = ${fnName}(input);
  if (result) printf("%s", result);
  return 0;
}
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
)

${code}

type JsonVal struct {
  val  interface{}
  arr  []JsonVal
  typ  int
}

func parseJson(input string) JsonVal {
  var val interface{}
  json.Unmarshal([]byte(input), &val)
  return toJsonVal(val)
}

func toJsonVal(v interface{}) JsonVal {
  if v == nil { return JsonVal{typ: 0} }
  switch t := v.(type) {
  case bool: return JsonVal{typ: 1, val: t}
  case float64: return JsonVal{typ: 2, val: int(t)}
  case string: return JsonVal{typ: 3, val: t}
  case []interface{}:
    arr := make([]JsonVal, len(t))
    for i, item := range t { arr[i] = toJsonVal(item) }
    return JsonVal{typ: 4, arr: arr}
  }
  return JsonVal{}
}

func (j JsonVal) asInt() int {
  if j.typ == 2 { return j.val.(int) }
  return 0
}
func (j JsonVal) asStr() string {
  if j.typ == 3 { return j.val.(string) }
  return ""
}
func (j JsonVal) asIntVec() []int {
  r := []int{}
  if j.typ == 4 { for _, v := range j.arr { r = append(r, v.asInt()) } }
  return r
}
func (j JsonVal) asStrVec() []string {
  r := []string{}
  if j.typ == 4 { for _, v := range j.arr { r = append(r, v.asStr()) } }
  return r
}
func (j JsonVal) asIntVecVec() [][]int {
  r := [][]int{}
  if j.typ == 4 { for _, v := range j.arr { r = append(r, v.asIntVec()) } }
  return r
}
func (j JsonVal) asCharVecVec() [][]byte {
  r := [][]byte{}
  if j.typ == 4 { for _, v := range j.arr { r = append(r, []byte(v.asStr())) } }
  return r
}
func toJsonStr(val interface{}) string {
  b, _ := json.Marshal(val)
  return string(b)
}

func main() {
  scanner := bufio.NewScanner(os.Stdin)
  var input string
  for scanner.Scan() { input += scanner.Text() }
  parsed := parseJson(input)
  sol := Solution{}

  var result interface{}
  if parsed.typ == 4 && len(parsed.arr) > 0 {
    args := parsed.arr
    if args[0].typ == 4 && len(args[0].arr) > 0 && args[0].arr[0].typ == 4 && len(args[0].arr[0].arr) > 0 && args[0].arr[0].arr[0].typ == 3 {
      result = sol.${fnName}(args[0].asCharVecVec())
    } else if args[0].typ == 4 && len(args[0].arr) > 0 && args[0].arr[0].typ == 4 {
      if len(args) == 1 { result = sol.${fnName}(args[0].asIntVecVec()) }
    } else if args[0].typ == 4 && len(args[0].arr) > 0 && args[0].arr[0].typ == 2 {
      if len(args) == 1 { result = sol.${fnName}(args[0].asIntVec()) }
      if len(args) == 2 { result = sol.${fnName}(args[0].asIntVec(), args[1].asInt()) }
    } else if args[0].typ == 3 && len(args) >= 2 && args[1].typ == 4 {
      result = sol.${fnName}(args[0].asStr(), args[1].asStrVec())
    } else if args[0].typ == 3 && len(args) >= 2 && args[1].typ == 3 {
      if len(args) == 2 { result = sol.${fnName}(args[0].asStr(), args[1].asStr()) }
      if len(args) == 3 { result = sol.${fnName}(args[0].asStr(), args[1].asStr(), args[2].asStrVec()) }
    } else if args[0].typ == 3 {
      result = sol.${fnName}(args[0].asStr())
    } else if args[0].typ == 2 {
      result = sol.${fnName}(args[0].asInt())
    }
  } else {
    result = sol.${fnName}()
  }
  fmt.Print(toJsonStr(result))
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
  let injected = false;
  for (const ph of placeholders) {
    if (code.includes(ph)) { code = code.replace(ph, userCode); injected = true; break; }
  }
  // If harness lacks a user-code placeholder, fall back so we don't silently drop the user's solution
  if (!injected) {
    return null;
  }
  let escaped = testInput;
  if (language === 'java' || language === 'cpp') {
    escaped = escaped.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r\n/g, '\\n').replace(/\r/g, '\\n').replace(/\n/g, '\\n');
  }
  code = code.replace(/__TEST_INPUT__/g, escaped);
  return code;
}

module.exports = { getLanguageId, extractFunctionName, wrapCodeForTest, buildCodeFromHarness, KNOWN_FUNCTIONS };
