'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('../models/Problem');

const problems = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    companies: ['amazon', 'google'],
    tags: ['array', 'hash-table'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices* of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
    ],
    hiddenTests: [
      { input: '[3,3]\n6', expectedOutput: '[0,1]' },
      { input: '[1,2,3,4,5]\n9', expectedOutput: '[3,4]' },
      { input: '[-1,-2,-3,-4,-5]\n-8', expectedOutput: '[2,4]' },
    ],
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
      { input: '[3,3]\n6', expectedOutput: '[0,1]' },
      { input: '[2,5,5,11]\n10', expectedOutput: '[1,2]' },
    ],
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 49.1,
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Time: O(n), Space: O(n) using hash map
    // Your solution here
    return [0, 1];
};`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Time: O(n), Space: O(n)
        # Your solution here
        return [0, 1]`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Time: O(n), Space: O(n)
        // Your solution here
        return new int[]{0, 1};
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Time: O(n), Space: O(n)
        // Your solution here
        return {0, 1};
    }
};`,
      go: `func twoSum(nums []int, target int) []int {
    // Time: O(n), Space: O(n)
    // Your solution here
    return []int{0, 1}
}`,
    },
    testHarness: {
      javascript: `// __USER_CODE__
const lines = \`__TEST_INPUT__\`.trim().split('\\n');
const nums = JSON.parse(lines[0]);
const target = parseInt(lines[1]);
console.log(JSON.stringify(twoSum(nums, target)));`,
      typescript: `// __USER_CODE__
const lines: string[] = \`__TEST_INPUT__\`.trim().split('\\n');
const nums: number[] = JSON.parse(lines[0]);
const target: number = parseInt(lines[1]);
console.log(JSON.stringify(twoSum(nums, target)));`,
      python: `import json, sys
# __USER_CODE__
data = """__TEST_INPUT__""".strip().split('\\n')
nums = json.loads(data[0])
target = int(data[1])
print(json.dumps(Solution().twoSum(nums, target)))`,
      java: `import java.util.*;
// __USER_CODE__
public class Main {
  public static void main(String[] args) {
    String input = "__TEST_INPUT__";
    String[] lines = input.split("\\n");
    int[] nums = Arrays.stream(lines[0].replaceAll("[\\\\[\\\\]\\\\s]","").split(",")).mapToInt(Integer::parseInt).toArray();
    int target = Integer.parseInt(lines[1].trim());
    Solution sol = new Solution();
    System.out.println(Arrays.toString(sol.twoSum(nums, target)));
  }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;
// __USER_CODE__
int main() {
  string input = "__TEST_INPUT__";
  istringstream iss(input);
  string line1, line2;
  getline(iss, line1); getline(iss, line2);
  vector<int> nums;
  string tmp = line1.substr(1, line1.size()-2);
  stringstream ss(tmp); string token;
  while (getline(ss, token, ',')) nums.push_back(stoi(token));
  int target = stoi(line2);
  Solution sol;
  auto res = sol.twoSum(nums, target);
  cout << "[" << res[0] << "," << res[1] << "]" << endl;
}`,
      go: `package main
import (
  "encoding/json"
  "fmt"
  "strings"
  "strconv"
)
// __USER_CODE__
func main() {
  input := \`__TEST_INPUT__\`
  lines := strings.Split(strings.TrimSpace(input), "\\n")
  var nums []int
  json.Unmarshal([]byte(lines[0]), &nums)
  target, _ := strconv.Atoi(strings.TrimSpace(lines[1]))
  res := twoSum(nums, target)
  out, _ := json.Marshal(res)
  fmt.Println(string(out))
}`,
    },
    stubs: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
  
};`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};`,
      go: `func twoSum(nums []int, target int) []int {
    
}`,
    },
    hints: [
      "Hint 1: The brute-force approach checks every pair with two nested loops — O(n²). Eliminate the inner loop using a hash map for O(1) lookups.",
      "Hint 2: As you iterate, store each number's index. For each number, compute its complement (target - nums[i]) and check if it already exists in the map.",
      "Hint 3: When you find a complement in the map, return both indices immediately for an O(n) time and O(n) space solution.",
    ],
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'easy',
    companies: ['microsoft', 'meta'],
    tags: ['string', 'stack'],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: 'The single pair of parentheses is properly opened and closed.',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: 'Each pair is valid and properly nested.',
      },
    ],
    hiddenTests: [
      { input: '(]', expectedOutput: 'false' },
      { input: '([)]', expectedOutput: 'false' },
      { input: '{[]}', expectedOutput: 'true' },
    ],
    testCases: [
      { input: '()', expectedOutput: 'true' },
      { input: '()[]{} ', expectedOutput: 'true' },
      { input: '(]', expectedOutput: 'false' },
      { input: '({[]})', expectedOutput: 'true' },
    ],
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only \'()[]{}\`.',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 40.7,
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    // Time: O(n), Space: O(n) using stack
    // Your solution here
    return true;
};`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Time: O(n), Space: O(n)
        # Your solution here
        return True`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Time: O(n), Space: O(n)
        // Your solution here
        return true;
    }
}`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        // Time: O(n), Space: O(n)
        // Your solution here
        return true;
    }
};`,
      go: `func isValid(s string) bool {
    // Time: O(n), Space: O(n)
    // Your solution here
    return true
}`,
    },
    stubs: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
  
};`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        pass`,
      java: `class Solution {
    public boolean isValid(String s) {
        
    }
}`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        
    }
};`,
      go: `func isValid(s string) bool {
    
}`,
    },
    hints: [
      "Hint 1: Think about the LIFO nature of matching brackets — the most recently opened bracket must be closed first.",
      "Hint 2: Use a stack: push opening brackets. When you see a closing bracket, verify it matches the bracket on top of the stack.",
      "Hint 3: If the stack is empty when you see a closing bracket, or the top doesn't match, return false. After processing all characters, the stack must be empty.",
    ],
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'easy',
    companies: ['amazon'],
    tags: ['array', 'dynamic-programming'],
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return \`0\`.`,
    examples: [
      {
        input: 'prices = [7,1,5,3,6,4]',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5. Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.',
      },
      {
        input: 'prices = [7,6,4,3,1]',
        output: '0',
        explanation: 'In this case, no transactions are done and the max profit = 0.',
      },
    ],
    hiddenTests: [
      { input: '[2,4,1]', expectedOutput: '2' },
      { input: '[1,2]', expectedOutput: '1' },
      { input: '[2,1,2,1,0,1,2]', expectedOutput: '2' },
    ],
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5' },
      { input: '[7,6,4,3,1]', expectedOutput: '0' },
      { input: '[2,4,1]', expectedOutput: '2' },
      { input: '[3,2,6,5,0,3]', expectedOutput: '4' },
    ],
    constraints: '1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 54.2,
    starterCode: {
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
    // Time: O(n), Space: O(1)
    // Your solution here
    return 0;
};`,
      python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # Time: O(n), Space: O(1)
        # Your solution here
        return 0`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        // Time: O(n), Space: O(1)
        // Your solution here
        return 0;
    }
}`,
      cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Time: O(n), Space: O(1)
        // Your solution here
        return 0;
    }
};`,
      go: `func maxProfit(prices []int) int {
    // Time: O(n), Space: O(1)
    // Your solution here
    return 0
}`,
    },
    stubs: {
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
  
};`,
      python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        pass`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        
    }
}`,
      cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        
    }
};`,
      go: `func maxProfit(prices []int) int {
    
}`,
    },
    hints: [
      "Hint 1: Track the minimum price seen so far as you iterate from left to right — you can only sell after buying.",
      "Hint 2: For each day, calculate the profit if you sold at the current price (current - min price so far). Update the max profit when a higher value is found.",
      "Hint 3: This is a single-pass O(n) solution with O(1) space — no nested loops or DP arrays needed.",
    ],
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'medium',
    companies: ['google'],
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return *its sum*.

A **subarray** is a contiguous part of an array.`,
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
      {
        input: 'nums = [5,4,-1,7,8]',
        output: '23',
        explanation: 'The subarray [5,4,-1,7,8] has the largest sum 23.',
      },
    ],
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
      { input: '[5,4,-1,7,8]', expectedOutput: '23' },
      { input: '[1]', expectedOutput: '1' },
      { input: '[-1,-2,-3,-4]', expectedOutput: '-1' },
    ],
    hiddenTests: [
      { input: '[1]', expectedOutput: '1' },
      { input: '[-1,-2,-3,-4]', expectedOutput: '-1' },
      { input: '[0,0,0,0]', expectedOutput: '0' },
    ],
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 50.3,
    stubs: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
  
};`,
      python: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        pass`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        
    }
}`,
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        
    }
};`,
      go: `func maxSubArray(nums []int) int {
    
}`,
    },
    hints: [
      "Hint 1: Kadane's algorithm: at each position, decide whether to start a new subarray or extend the existing one based on the running sum.",
      "Hint 2: Maintain a running sum. If it becomes negative, reset it to 0. Track the maximum sum encountered.",
      "Hint 3: The key insight: a subarray with a negative sum will only decrease any sum it's added to, so discard it and start fresh.",
    ],
  },
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'medium',
    companies: ['amazon', 'google'],
    tags: ['array', 'graph', 'bfs', 'dfs', 'matrix'],
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return *the number of islands*.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are surrounded by water.`,
    examples: [
      {
        input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        output: '1',
        explanation: 'All the land cells are connected, forming one island.',
      },
      {
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        output: '3',
        explanation: 'There are three separate islands in the grid.',
      },
    ],
    testCases: [
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1' },
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3' },
      { input: '[["1"]]', expectedOutput: '1' },
      { input: '[["0"]]', expectedOutput: '0' },
    ],
    hiddenTests: [
      { input: '[["1"]]', expectedOutput: '1' },
      { input: '[["0"]]', expectedOutput: '0' },
      { input: '[["1","0","1"],["0","1","0"],["1","0","1"]]', expectedOutput: '5' },
    ],
    constraints: 'm == grid.length\nn == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is \'0\' or \'1\'.',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 57.4,
    stubs: {
      javascript: `/**
 * @param {character[][]} grid
 * @return {number}
 */
var numIslands = function(grid) {
  
};`,
      python: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        pass`,
      java: `class Solution {
    public int numIslands(char[][] grid) {
        
    }
}`,
      cpp: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        
    }
};`,
      go: `func numIslands(grid [][]byte) int {
    
}`,
    },
    hints: [
      "Hint 1: Treat the grid as a graph where each '1' is a node connected to adjacent '1's (up, down, left, right).",
      "Hint 2: When you find a '1', increment the island count and perform DFS or BFS to mark all connected '1's as visited.",
      "Hint 3: Mark visited cells by setting them to '0' to avoid revisiting. This modifies the input grid but achieves O(m × n) time.",
    ],
  },
  {
    title: 'LRU Cache',
    slug: 'lru-cache',
    difficulty: 'hard',
    companies: ['amazon', 'microsoft'],
    tags: ['hash-table', 'linked-list', 'design'],
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with **positive** size \`capacity\`.
- \`int get(int key)\` Return the value of the \`key\` if the key exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` Update the value of the \`key\` if the \`key\` exists. Otherwise, add the \`key-value\` pair to the cache. If the number of keys exceeds the \`capacity\` from this operation, **evict** the least recently used key.

The functions \`get\` and \`put\` must each run in \`O(1)\` average time complexity.`,
    examples: [
      {
        input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]',
        output: '[null,null,null,1,null,-1,null,-1,3,4]',
        explanation: 'LRUCache lRUCache = new LRUCache(2);\nlRUCache.put(1, 1); // cache is {1=1}\nlRUCache.put(2, 2); // cache is {1=1, 2=2}\nlRUCache.get(1);    // return 1\nlRUCache.put(3, 3); // LRU key was 2, evicts key 2, cache is {1=1, 3=3}\nlRUCache.get(2);    // returns -1 (not found)\nlRUCache.put(4, 4); // LRU key was 1, evicts key 1, cache is {4=4, 3=3}\nlRUCache.get(1);    // return -1 (not found)\nlRUCache.get(3);    // return 3\nlRUCache.get(4);    // return 4',
      },
      {
        input: '["LRUCache","put","get"]\n[[1],[2,1],[2]]',
        output: '[null,null,1]',
        explanation: 'Cache of capacity 1 with a single put then get.',
      },
    ],
    testCases: [
      { input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', expectedOutput: '[null,null,null,1,null,-1,null,-1,3,4]' },
      { input: '["LRUCache","put","get"]\n[[1],[2,1],[2]]', expectedOutput: '[null,null,1]' },
      { input: '["LRUCache","put","put","get","put","get"]\n[[2],[1,1],[2,2],[2],[3,3],[1]]', expectedOutput: '[null,null,null,2,null,-1]' },
      { input: '["LRUCache","put","put","put","get","get"]\n[[2],[2,1],[3,2],[4,3],[2],[3]]', expectedOutput: '[null,null,null,null,-1,2]' },
    ],
    hiddenTests: [
      { input: '["LRUCache","put","put","put","get","get"]\n[[2],[1,10],[2,20],[3,30],[1],[2]]', expectedOutput: '[null,null,null,null,-1,20]' },
      { input: '["LRUCache","get"]\n[[1],[1]]', expectedOutput: '[null,-1]' },
      { input: '["LRUCache","put","get","put","get","get"]\n[[1],[1,1],[1],[2,2],[1],[2]]', expectedOutput: '[null,null,1,null,-1,2]' },
    ],
    constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5\nAt most 2 * 10^5 calls will be made to get and put.',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 41.6,
    stubs: {
      javascript: `/**
 * @param {number} capacity
 */
var LRUCache = function(capacity) {
  
};

/** 
 * @param {number} key
 * @return {number}
 */
LRUCache.prototype.get = function(key) {
  
};

/** 
 * @param {number} key 
 * @param {number} value
 * @return {void}
 */
LRUCache.prototype.put = function(key, value) {
  
};`,
      python: `class LRUCache:
    def __init__(self, capacity: int):
        pass

    def get(self, key: int) -> int:
        pass

    def put(self, key: int, value: int) -> None:
        pass`,
      java: `class LRUCache {
    public LRUCache(int capacity) {
        
    }
    
    public int get(int key) {
        
    }
    
    public void put(int key, int value) {
        
    }
}`,
      cpp: `class LRUCache {
public:
    LRUCache(int capacity) {
        
    }
    
    int get(int key) {
        
    }
    
    void put(int key, int value) {
        
    }
};`,
      go: `type LRUCache struct {
    
}

func Constructor(capacity int) LRUCache {
    
}

func (this *LRUCache) Get(key int) int {
    
}

func (this *LRUCache) Put(key int, value int) {
    
}`,
    },
    hints: [
      "Hint 1: To achieve O(1) for both get and put, combine a hash map with a doubly linked list.",
      "Hint 2: The doubly linked list keeps most recently used items near the head, least recently used near the tail.",
      "Hint 3: On get, move the accessed node to the head. On put, add at the head; if over capacity, evict the tail.",
    ],
  },
  {
    title: 'Word Break',
    slug: 'word-break',
    difficulty: 'medium',
    companies: ['google'],
    tags: ['string', 'dynamic-programming', 'trie', 'memoization'],
    description: `Given a string \`s\` and a dictionary of strings \`wordDict\`, return \`true\` if \`s\` can be segmented into a space-separated sequence of one or more dictionary words.

**Note** that the same word in the dictionary may be reused multiple times in the segmentation.`,
    examples: [
      {
        input: 's = "leetcode", wordDict = ["leet","code"]',
        output: 'true',
        explanation: 'Return true because "leetcode" can be segmented as "leet code".',
      },
      {
        input: 's = "applepenapple", wordDict = ["apple","pen"]',
        output: 'true',
        explanation: 'Return true because "applepenapple" can be segmented as "apple pen apple". Note that you are allowed to reuse a dictionary word.',
      },
    ],
    testCases: [
      { input: '"leetcode"\n["leet","code"]', expectedOutput: 'true' },
      { input: '"applepenapple"\n["apple","pen"]', expectedOutput: 'true' },
      { input: '"catsandog"\n["cats","dog","sand","and","cat"]', expectedOutput: 'false' },
      { input: '"aaaaaaa"\n["aaaa","aaa"]', expectedOutput: 'true' },
    ],
    hiddenTests: [
      { input: '"catsandog"\n["cats","dog","sand","and","cat"]', expectedOutput: 'false' },
      { input: '"a"\n["a"]', expectedOutput: 'true' },
      { input: '"aaaaaaa"\n["aaaa","aaa"]', expectedOutput: 'true' },
    ],
    constraints: '1 <= s.length <= 300\n1 <= wordDict.length <= 1000\n1 <= wordDict[i].length <= 20\ns and wordDict[i] consist of only lowercase English letters.\nAll the strings of wordDict are unique.',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 45.2,
    stubs: {
      javascript: `/**
 * @param {string} s
 * @param {string[]} wordDict
 * @return {boolean}
 */
var wordBreak = function(s, wordDict) {
  
};`,
      python: `class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        pass`,
      java: `class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        
    }
}`,
      cpp: `class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        
    }
};`,
      go: `func wordBreak(s string, wordDict []string) bool {
    
}`,
    },
    hints: [
      "Hint 1: Break the problem into subproblems: can each prefix s[0:i] be segmented using the dictionary?",
      "Hint 2: Use DP: dp[i] = true if s[0:i] can be segmented. For each j < i, if dp[j] and s[j:i] is in the dict, set dp[i] = true.",
      "Hint 3: Store the dictionary in a hash set for O(1) lookups. Precompute word lengths to bound the inner loop.",
    ],
  },
  {
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    difficulty: 'medium',
    companies: ['google', 'meta'],
    tags: ['array', 'sorting'],
    description: `Given an array of \`intervals\` where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return *an array of the non-overlapping intervals that cover all the intervals in the input*.`,
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Since intervals [1,3] and [2,6] overlap, merge them into [1,6].',
      },
      {
        input: 'intervals = [[1,4],[4,5]]',
        output: '[[1,5]]',
        explanation: 'Intervals [1,4] and [4,5] are considered overlapping.',
      },
    ],
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]' },
      { input: '[[1,4],[2,3]]', expectedOutput: '[[1,4]]' },
      { input: '[[1,4],[0,4]]', expectedOutput: '[[0,4]]' },
    ],
    hiddenTests: [
      { input: '[[1,4],[2,3]]', expectedOutput: '[[1,4]]' },
      { input: '[[1,4],[0,4]]', expectedOutput: '[[0,4]]' },
      { input: '[[1,4],[0,0]]', expectedOutput: '[[0,0],[1,4]]' },
    ],
    constraints: '1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= starti <= endi <= 10^4',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 46.5,
    stubs: {
      javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
var merge = function(intervals) {
  
};`,
      python: `class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        pass`,
      java: `class Solution {
    public int[][] merge(int[][] intervals) {
        
    }
}`,
      cpp: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        
    }
};`,
      go: `func merge(intervals [][]int) [][]int {
    
}`,
    },
    hints: [
      "Hint 1: Sorting the intervals by start time makes overlapping intervals adjacent.",
      "Hint 2: After sorting, if the current interval's start ≤ the last merged interval's end, they overlap — merge by updating the end.",
      "Hint 3: If they don't overlap, simply append the current interval as a new entry to the result list.",
    ],
  },
  {
    title: 'Binary Tree Level Order Traversal',
    slug: 'binary-tree-level-order-traversal',
    difficulty: 'medium',
    companies: ['amazon'],
    tags: ['tree', 'bfs', 'binary-tree'],
    description: `Given the \`root\` of a binary tree, return *the level order traversal of its nodes' values* (i.e., from left to right, level by level).`,
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        output: '[[3],[9,20],[15,7]]',
        explanation: 'Level 0: [3], Level 1: [9, 20], Level 2: [15, 7].',
      },
      {
        input: 'root = [1]',
        output: '[[1]]',
        explanation: 'Single node tree returns a single level with one element.',
      },
    ],
    testCases: [
      { input: '[3,9,20,null,null,15,7]', expectedOutput: '[[3],[9,20],[15,7]]' },
      { input: '[1]', expectedOutput: '[[1]]' },
      { input: '[]', expectedOutput: '[]' },
      { input: '[1,2,3,4,5]', expectedOutput: '[[1],[2,3],[4,5]]' },
    ],
    hiddenTests: [
      { input: '[]', expectedOutput: '[]' },
      { input: '[1,2,3,4,5]', expectedOutput: '[[1],[2,3],[4,5]]' },
      { input: '[1,null,2,null,3]', expectedOutput: '[[1],[2],[3]]' },
    ],
    constraints: 'The number of nodes in the tree is in the range [0, 2000].\n-1000 <= Node.val <= 1000',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 64.8,
    stubs: {
      javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
var levelOrder = function(root) {
  
};`,
      python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        pass`,
      java: `class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        
    }
}`,
      cpp: `class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        
    }
};`,
      go: `func levelOrder(root *TreeNode) [][]int {
    
}`,
    },
    hints: [
      "Hint 1: This is a classic BFS problem. Use a queue to process nodes level by level.",
      "Hint 2: Start by enqueuing the root. For each level, record the number of nodes currently in the queue, then process exactly that many.",
      "Hint 3: For each processed node, record its value and enqueue its left and right children. Continue until the queue is empty.",
    ],
  },
  {
    title: 'Coin Change',
    slug: 'coin-change',
    difficulty: 'medium',
    companies: ['amazon', 'google'],
    tags: ['array', 'dynamic-programming', 'breadth-first-search'],
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    examples: [
      {
        input: 'coins = [1,5,11,25], amount = 36',
        output: '2',
        explanation: '25 + 11 = 36 uses 2 coins, which is the minimum.',
      },
      {
        input: 'coins = [2], amount = 3',
        output: '-1',
        explanation: 'It is impossible to make 3 using only coins of denomination 2.',
      },
    ],
    testCases: [
      { input: '[1,5,11,25]\n36', expectedOutput: '2' },
      { input: '[1]\n0', expectedOutput: '0' },
      { input: '[2]\n3', expectedOutput: '-1' },
      { input: '[186,419,83,408]\n6249', expectedOutput: '20' },
    ],
    hiddenTests: [
      { input: '[1,5,11,25]\n36', expectedOutput: '2' },
      { input: '[1]\n0', expectedOutput: '0' },
      { input: '[186,419,83,408]\n6249', expectedOutput: '20' },
    ],
    constraints: '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 42.6,
    stubs: {
      javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
var coinChange = function(coins, amount) {
  
};`,
      python: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        pass`,
      java: `class Solution {
    public int coinChange(int[] coins, int amount) {
        
    }
}`,
      cpp: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        
    }
};`,
      go: `func coinChange(coins []int, amount int) int {
    
}`,
    },
    hints: [
      "Hint 1: This is an unbounded knapsack DP problem. Define dp[i] = minimum coins needed for amount i.",
      "Hint 2: Initialize dp[0] = 0, others to a large sentinel (amount + 1). For each coin, update dp[i] = min(dp[i], dp[i - coin] + 1).",
      "Hint 3: After processing, if dp[amount] is still the sentinel, return -1; otherwise return dp[amount].",
    ],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'medium',
    companies: ['amazon', 'google', 'meta'],
    tags: ['string', 'hash-table', 'sliding-window'],
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
    ],
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3' },
      { input: '"bbbbb"', expectedOutput: '1' },
      { input: '"pwwkew"', expectedOutput: '3' },
      { input: '"dvdf"', expectedOutput: '3' },
    ],
    hiddenTests: [
      { input: '""', expectedOutput: '0' },
      { input: '" "', expectedOutput: '1' },
      { input: '"au"', expectedOutput: '2' },
    ],
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 33.5,
    hints: [
      "Hint 1: Use a sliding window with two pointers (left and right) to maintain a window of characters without repeats.",
      "Hint 2: Store each character's most recent index in a hash map. On a repeat, move left to just after the previous occurrence.",
      "Hint 3: The window length is right - left + 1. Track the maximum length seen.",
    ],
    stubs: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
  
};`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        pass`,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        
    }
}`,
      cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        
    }
};`,
      go: `func lengthOfLongestSubstring(s string) int {
    
}`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
    
}`,
    },
  },
  {
    title: 'House Robber',
    slug: 'house-robber',
    difficulty: 'medium',
    companies: ['amazon', 'google', 'microsoft'],
    tags: ['array', 'dynamic-programming'],
    description: `You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and **it will automatically contact the police if two adjacent houses were broken into on the same night**.

Given an integer array \`nums\` representing the amount of money of each house, return *the maximum amount of money you can rob tonight **without alerting the police***.`,
    examples: [
      {
        input: 'nums = [1,2,3,1]',
        output: '4',
        explanation: 'Rob house 1 (money = 1) and then house 3 (money = 3). Total = 1 + 3 = 4.',
      },
      {
        input: 'nums = [2,7,9,3,1]',
        output: '12',
        explanation: 'Rob house 1 (money = 2), house 3 (money = 9) and house 5 (money = 1). Total = 2 + 9 + 1 = 12.',
      },
    ],
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: '4' },
      { input: '[2,7,9,3,1]', expectedOutput: '12' },
      { input: '[1,2]', expectedOutput: '2' },
      { input: '[2,1,1,2]', expectedOutput: '4' },
    ],
    hiddenTests: [
      { input: '[0]', expectedOutput: '0' },
      { input: '[5]', expectedOutput: '5' },
      { input: '[1,3,1,3,100]', expectedOutput: '103' },
    ],
    constraints: '1 <= nums.length <= 100\n0 <= nums[i] <= 400',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 51.2,
    hints: [
      "Hint 1: At each house, you have two choices — rob it or skip it. The decision depends on the previous house's result.",
      "Hint 2: dp[i] = max(dp[i-1], dp[i-2] + nums[i-1]). dp[i] is the max amount from first i houses.",
      "Hint 3: You only need the last two values, so optimize to O(1) space with two variables.",
    ],
    stubs: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var rob = function(nums) {
  
};`,
      python: `class Solution:
    def rob(self, nums: List[int]) -> int:
        pass`,
      java: `class Solution {
    public int rob(int[] nums) {
        
    }
}`,
      cpp: `class Solution {
public:
    int rob(vector<int>& nums) {
        
    }
};`,
      go: `func rob(nums []int) int {
    
}`,
      typescript: `function rob(nums: number[]): number {
    
}`,
    },
  },
  {
    title: 'Course Schedule',
    slug: 'course-schedule',
    difficulty: 'medium',
    companies: ['google', 'amazon', 'meta'],
    tags: ['graph', 'topological-sort', 'bfs', 'dfs'],
    description: `There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [ai, bi]\` indicates that you **must** take course \`bi\` first if you want to take course \`ai\`.

Return \`true\` if you can finish all courses. Otherwise, return \`false\`.`,
    examples: [
      {
        input: 'numCourses = 2, prerequisites = [[1,0]]',
        output: 'true',
        explanation: 'To take course 1 you should have finished course 0. So it is possible.',
      },
      {
        input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]',
        output: 'false',
        explanation: 'To take course 1 you need course 0, and to take course 0 you need course 1. Impossible.',
      },
    ],
    testCases: [
      { input: '2\n[[1,0]]', expectedOutput: 'true' },
      { input: '2\n[[1,0],[0,1]]', expectedOutput: 'false' },
      { input: '3\n[[1,0],[2,1]]', expectedOutput: 'true' },
      { input: '4\n[[1,0],[2,1],[3,2],[1,3]]', expectedOutput: 'false' },
    ],
    hiddenTests: [
      { input: '1\n[]', expectedOutput: 'true' },
      { input: '3\n[[0,1],[1,2],[2,0]]', expectedOutput: 'false' },
      { input: '5\n[[1,0],[2,0],[3,1],[4,3]]', expectedOutput: 'true' },
    ],
    constraints: '1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000\nprerequisites[i].length == 2\n0 <= ai, bi < numCourses\nAll the pairs prerequisites[i] are unique.',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 46.4,
    hints: [
      "Hint 1: This is a cycle detection problem in a directed graph. If there's a cycle, you cannot finish all courses.",
      "Hint 2: Build an adjacency list and compute in-degrees. Use Kahn's algorithm (BFS): repeatedly remove nodes with in-degree 0.",
      "Hint 3: If you can process all nodes, there is no cycle. Use DFS with three states (unvisited, visiting, visited) to detect back edges.",
    ],
    stubs: {
      javascript: `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @return {boolean}
 */
var canFinish = function(numCourses, prerequisites) {
  
};`,
      python: `class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        pass`,
      java: `class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        
    }
}`,
      cpp: `class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        
    }
};`,
      go: `func canFinish(numCourses int, prerequisites [][]int) bool {
    
}`,
      typescript: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {
    
}`,
    },
  },
  {
    title: '3Sum',
    slug: '3sum',
    difficulty: 'medium',
    companies: ['amazon', 'google', 'meta'],
    tags: ['array', 'two-pointers', 'sorting'],
    description: `Given an integer array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets.`,
    examples: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        output: '[[-1,-1,2],[-1,0,1]]',
        explanation: 'The distinct triplets that sum to zero are [-1,-1,2] and [-1,0,1].',
      },
      {
        input: 'nums = [0,1,1]',
        output: '[]',
        explanation: 'No three numbers sum to zero.',
      },
    ],
    testCases: [
      { input: '[-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]' },
      { input: '[0,1,1]', expectedOutput: '[]' },
      { input: '[0,0,0]', expectedOutput: '[[0,0,0]]' },
      { input: '[-2,0,1,1,2]', expectedOutput: '[[-2,0,2],[-2,1,1]]' },
    ],
    hiddenTests: [
      { input: '[]', expectedOutput: '[]' },
      { input: '[0]', expectedOutput: '[]' },
      { input: '[-1,0,1,0]', expectedOutput: '[[-1,0,1]]' },
    ],
    constraints: '3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 34.2,
    hints: [
      "Hint 1: Sort the array first. This lets you use two pointers and easily skip duplicates.",
      "Hint 2: Fix the first element with a loop, then use two pointers (left = i+1, right = n-1) to find pairs summing to -nums[i].",
      "Hint 3: If sum is too small, move left up; if too large, move right down. Skip duplicate values to avoid duplicate triplets.",
    ],
    stubs: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
  
};`,
      python: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        pass`,
      java: `class Solution {
    public int[][] threeSum(int[] nums) {
        
    }
}`,
      cpp: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        
    }
};`,
      go: `func threeSum(nums []int) [][]int {
    
}`,
      typescript: `function threeSum(nums: number[]): number[][] {
    
}`,
    },
  },
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'hard',
    companies: ['google', 'amazon', 'microsoft'],
    tags: ['array', 'two-pointers', 'stack', 'dynamic-programming'],
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: [
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are trapped.',
      },
      {
        input: 'height = [4,2,0,3,2,5]',
        output: '9',
        explanation: 'The elevation map [4,2,0,3,2,5] traps 9 units of rain water.',
      },
    ],
    testCases: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6' },
      { input: '[4,2,0,3,2,5]', expectedOutput: '9' },
      { input: '[1,0,1]', expectedOutput: '1' },
      { input: '[3,0,2,0,4]', expectedOutput: '7' },
    ],
    hiddenTests: [
      { input: '[0]', expectedOutput: '0' },
      { input: '[5,4,3,2,1]', expectedOutput: '0' },
      { input: '[5,0,5]', expectedOutput: '5' },
    ],
    constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 59.1,
    hints: [
      "Hint 1: Water above a bar depends on the tallest bar to its left and the tallest bar to its right.",
      "Hint 2: Compute leftMax[i] and rightMax[i], then water at i = min(leftMax[i], rightMax[i]) - height[i].",
      "Hint 3: For O(1) space, use two pointers. Move the pointer with the smaller height inward, tracking the max seen from each side.",
    ],
    stubs: {
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
  
};`,
      python: `class Solution:
    def trap(self, height: List[int]) -> int:
        pass`,
      java: `class Solution {
    public int trap(int[] height) {
        
    }
}`,
      cpp: `class Solution {
public:
    int trap(vector<int>& height) {
        
    }
};`,
      go: `func trap(height []int) int {
    
}`,
      typescript: `function trap(height: number[]): number {
    
}`,
    },
  },
  {
    title: 'Pacific Atlantic Water Flow',
    slug: 'pacific-atlantic-water-flow',
    difficulty: 'medium',
    companies: ['google', 'amazon'],
    tags: ['matrix', 'graph', 'dfs', 'bfs'],
    description: `There is an \`m x n\` rectangular island that borders both the **Pacific Ocean** and **Atlantic Ocean**. The Pacific Ocean touches the island's left and top edges, and the Atlantic Ocean touches the right and bottom edges.

The rain water can flow to adjacent cells (north, south, east, west) if the adjacent cell's height is **greater than or equal to** the current cell's height.

Return a 2D list of grid coordinates where rain water can flow to **both** oceans. The result should be sorted in lexicographical order.`,
    examples: [
      {
        input: 'heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]',
        output: '[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]',
        explanation: 'The highlighted cells can flow to both oceans.',
      },
      {
        input: 'heights = [[1]]',
        output: '[[0,0]]',
        explanation: 'The single cell touches both oceans.',
      },
    ],
    testCases: [
      { input: '[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]', expectedOutput: '[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]' },
      { input: '[[1]]', expectedOutput: '[[0,0]]' },
      { input: '[[1,2],[4,3]]', expectedOutput: '[[0,1],[1,0],[1,1]]' },
      { input: '[[3,3,3],[3,1,3],[0,2,4]]', expectedOutput: '[[0,0],[0,1],[0,2],[1,0],[1,2],[2,1],[2,2]]' },
    ],
    hiddenTests: [
      { input: '[[1,2,3],[8,9,4],[7,6,5]]', expectedOutput: '[[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]' },
      { input: '[[10,10,10],[10,1,10],[10,10,10]]', expectedOutput: '[[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]]' },
      { input: '[[1,2,3,4],[12,13,14,5],[11,16,15,6],[10,9,8,7]]', expectedOutput: '[[0,3],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[3,0],[3,1],[3,2],[3,3]]' },
    ],
    constraints: 'm == heights.length\nn == heights[i].length\n1 <= m, n <= 200\n0 <= heights[i][j] <= 10^5',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 53.4,
    hints: [
      "Hint 1: Reverse the problem: start from each ocean and flow inward to cells that can reach it.",
      "Hint 2: Perform BFS/DFS from all Pacific-edge cells simultaneously, then from all Atlantic-edge cells.",
      "Hint 3: The result is the intersection of cells reachable from both oceans. Use two boolean matrices.",
    ],
    stubs: {
      javascript: `/**
 * @param {number[][]} heights
 * @return {number[][]}
 */
var pacificAtlantic = function(heights) {
  
};`,
      python: `class Solution:
    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:
        pass`,
      java: `class Solution {
    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        
    }
}`,
      cpp: `class Solution {
public:
    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {
        
    }
};`,
      go: `func pacificAtlantic(heights [][]int) [][]int {
    
}`,
      typescript: `function pacificAtlantic(heights: number[][]): number[][] {
    
}`,
    },
  },
  {
    title: 'Decode Ways',
    slug: 'decode-ways',
    difficulty: 'medium',
    companies: ['google', 'amazon', 'microsoft'],
    tags: ['string', 'dynamic-programming'],
    description: `A message containing letters from \`A-Z\` can be **encoded** into numbers using the mapping: \`'A' -> "1", 'B' -> "2", ..., 'Z' -> "26"\`.

To **decode** an encoded message, all the digits must be grouped, then mapped back into letters. For example, \`"11106"\` can be mapped into:
- \`"AAJF"\` with the grouping \`(1 1 10 6)\`
- \`"KJF"\` with the grouping \`(11 10 6)\`

Note that \`"06"\` cannot be mapped into \`'F'\` since \`"6"\` is different from \`"06"\`.

Given a string \`s\` containing only digits, return *the **number** of ways to decode it*.`,
    examples: [
      {
        input: 's = "12"',
        output: '2',
        explanation: '"12" could be decoded as "AB" (1 2) or "L" (12).',
      },
      {
        input: 's = "226"',
        output: '3',
        explanation: '"226" could be decoded as "BZ" (2 26), "VF" (22 6), or "BBF" (2 2 6).',
      },
    ],
    testCases: [
      { input: '"12"', expectedOutput: '2' },
      { input: '"226"', expectedOutput: '3' },
      { input: '"06"', expectedOutput: '0' },
      { input: '"11106"', expectedOutput: '2' },
    ],
    hiddenTests: [
      { input: '"0"', expectedOutput: '0' },
      { input: '"10"', expectedOutput: '1' },
      { input: '"1201234"', expectedOutput: '3' },
    ],
    constraints: '1 <= s.length <= 100\ns consists of only digits and may contain leading zero(s).',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 34.2,
    hints: [
      "Hint 1: This is similar to climbing stairs but with constraints on valid two-digit numbers (10-26).",
      "Hint 2: dp[i] = dp[i-1] (if s[i-1] is 1-9) + dp[i-2] (if s[i-2:i] is 10-26).",
      "Hint 3: Optimize to O(1) space using just two variables tracking the last two results.",
    ],
    stubs: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
var numDecodings = function(s) {
  
};`,
      python: `class Solution:
    def numDecodings(self, s: str) -> int:
        pass`,
      java: `class Solution {
    public int numDecodings(String s) {
        
    }
}`,
      cpp: `class Solution {
public:
    int numDecodings(string s) {
        
    }
};`,
      go: `func numDecodings(s string) int {
    
}`,
      typescript: `function numDecodings(s: string): number {
    
}`,
    },
  },
  {
    title: 'Rotate Image',
    slug: 'rotate-image',
    difficulty: 'medium',
    companies: ['amazon', 'microsoft', 'google'],
    tags: ['matrix', 'array'],
    description: `You are given an \`n x n\` 2D matrix representing an image, rotate the image by **90** degrees (clockwise).

You have to rotate the image **in-place**, which means you have to modify the input 2D matrix directly. **DO NOT** allocate another 2D matrix and do the rotation.`,
    examples: [
      {
        input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]',
        output: '[[7,4,1],[8,5,2],[9,6,3]]',
        explanation: 'Rotate the 3x3 matrix 90 degrees clockwise.',
      },
      {
        input: 'matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]',
        output: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]',
        explanation: 'Rotate the 4x4 matrix 90 degrees clockwise.',
      },
    ],
    testCases: [
      { input: '[[1,2,3],[4,5,6],[7,8,9]]', expectedOutput: '[[7,4,1],[8,5,2],[9,6,3]]' },
      { input: '[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]', expectedOutput: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]' },
      { input: '[[1]]', expectedOutput: '[[1]]' },
      { input: '[[1,2],[3,4]]', expectedOutput: '[[3,1],[4,2]]' },
    ],
    hiddenTests: [
      { input: '[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]', expectedOutput: '[[13,9,5,1],[14,10,6,2],[15,11,7,3],[16,12,8,4]]' },
      { input: '[[5,1],[2,4]]', expectedOutput: '[[2,5],[4,1]]' },
      { input: '[[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]]', expectedOutput: '[[21,16,11,6,1],[22,17,12,7,2],[23,18,13,8,3],[24,19,14,9,4],[25,20,15,10,5]]' },
    ],
    constraints: 'n == matrix.length == matrix[i].length\n1 <= n <= 20\n-1000 <= matrix[i][j] <= 1000',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 68.5,
    hints: [
      "Hint 1: Rotating by 90° clockwise is equivalent to transposing the matrix then reversing each row.",
      "Hint 2: To rotate in-place, process the matrix in layers (outermost to innermost). Swap groups of four cells at a time.",
      "Hint 3: For cell (i, j), its rotated positions are (j, n-1-i), (n-1-i, n-1-j), and (n-1-j, i). Swap these four in a cycle.",
    ],
    stubs: {
      javascript: `/**
 * @param {number[][]} matrix
 * @return {number[][]}
 */
var rotate = function(matrix) {
  
};`,
      python: `class Solution:
    def rotate(self, matrix: List[List[int]]) -> List[List[int]]:
        pass`,
      java: `class Solution {
    public int[][] rotate(int[][] matrix) {
        
    }
}`,
      cpp: `class Solution {
public:
    vector<vector<int>> rotate(vector<vector<int>>& matrix) {
        
    }
};`,
      go: `func rotate(matrix [][]int) [][]int {
    
}`,
      typescript: `function rotate(matrix: number[][]): number[][] {
    
}`,
    },
  },
  {
    title: 'Word Ladder',
    slug: 'word-ladder',
    difficulty: 'hard',
    companies: ['amazon', 'google', 'microsoft'],
    tags: ['string', 'bfs', 'graph'],
    description: `A **transformation sequence** from word \`beginWord\` to word \`endWord\` using a dictionary \`wordList\` is a sequence of words \`beginWord = s0, s1, s2, ..., sk = endWord\` such that:

- Each adjacent pair of words differs by a single letter.
- Every \`si\` for \`1 <= i <= k\` is in \`wordList\`.
- \`beginWord\` does not need to be in \`wordList\`.

Return *the **number of words** in the shortest transformation sequence, or \`0\` if no such sequence exists.*`,
    examples: [
      {
        input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]',
        output: '5',
        explanation: 'The shortest transformation is "hit" → "hot" → "dot" → "dog" → "cog", 5 words.',
      },
      {
        input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]',
        output: '0',
        explanation: 'The endWord "cog" is not in wordList, so no valid transformation exists.',
      },
    ],
    testCases: [
      { input: '"hit"\n"cog"\n["hot","dot","dog","lot","log","cog"]', expectedOutput: '5' },
      { input: '"hit"\n"cog"\n["hot","dot","dog","lot","log"]', expectedOutput: '0' },
      { input: '"a"\n"c"\n["a","b","c"]', expectedOutput: '2' },
      { input: '"hot"\n"dog"\n["hot","dog","dot"]', expectedOutput: '3' },
    ],
    hiddenTests: [
      { input: '"hit"\n"hot"\n["hot","hit"]', expectedOutput: '2' },
      { input: '"lost"\n"cost"\n["most","fost","cost","lost"]', expectedOutput: '3' },
      { input: '"cat"\n"fin"\n["cot","dot","dog","dig","fin","cin","cog"]', expectedOutput: '0' },
    ],
    constraints: '1 <= beginWord.length <= 10\nbeginWord.length == endWord.length == wordList[i].length\n1 <= wordList.length <= 5000\nwordList[i] consists of lowercase English letters.\nbeginWord and endWord are distinct.',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 38.8,
    hints: [
      "Hint 1: This is a shortest path problem in an unweighted graph where words are nodes and edges connect words differing by one letter.",
      "Hint 2: Use BFS from beginWord. BFS guarantees the shortest path in an unweighted graph.",
      "Hint 3: For each word, generate all possible next words by changing each character to 'a' through 'z'. Use a hash set for O(1) dictionary lookups.",
    ],
    stubs: {
      javascript: `/**
 * @param {string} beginWord
 * @param {string} endWord
 * @param {string[]} wordList
 * @return {number}
 */
var ladderLength = function(beginWord, endWord, wordList) {
  
};`,
      python: `class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:
        pass`,
      java: `class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        
    }
}`,
      cpp: `class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        
    }
};`,
      go: `func ladderLength(beginWord string, endWord string, wordList []string) int {
    
}`,
      typescript: `function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
    
}`,
    },
  },
  {
    title: 'Serialize and Deserialize Binary Tree',
    slug: 'serialize-and-deserialize-binary-tree',
    difficulty: 'hard',
    companies: ['google', 'amazon', 'microsoft'],
    tags: ['tree', 'dfs', 'bfs', 'design'],
    description: `Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later.

Design an algorithm to serialize and deserialize a binary tree. You just need to ensure that a binary tree can be serialized to an array representation and deserialized back to the original tree structure.

The encoded tree should be in level-order (BFS) representation compatible with LeetCode's binary tree serialization format.`,
    examples: [
      {
        input: 'root = [1,2,3,null,null,4,5]',
        output: '[1,2,3,null,null,4,5]',
        explanation: 'The tree is serialized then deserialized back to the original tree.',
      },
      {
        input: 'root = []',
        output: '[]',
        explanation: 'An empty tree serializes to an empty array.',
      },
    ],
    testCases: [
      { input: '[1,2,3,null,null,4,5]', expectedOutput: '[1,2,3,null,null,4,5]' },
      { input: '[]', expectedOutput: '[]' },
      { input: '[1]', expectedOutput: '[1]' },
      { input: '[1,2,null,3]', expectedOutput: '[1,2,null,3]' },
    ],
    hiddenTests: [
      { input: '[1,null,2,null,3]', expectedOutput: '[1,null,2,null,3]' },
      { input: '[1,2,3,4,5,6,7]', expectedOutput: '[1,2,3,4,5,6,7]' },
      { input: '[3,1,4,null,2]', expectedOutput: '[3,1,4,null,2]' },
    ],
    constraints: 'The number of nodes in the tree is in the range [0, 10^4].\n-1000 <= Node.val <= 1000',
    timeLimit: 2000,
    memoryLimit: 256,
    acceptanceRate: 56.0,
    hints: [
      "Hint 1: Serialization can be done using DFS (pre-order) or BFS (level-order). LeetCode uses BFS with nulls included.",
      "Hint 2: During serialization (BFS), use a queue and include null children explicitly to preserve structure.",
      "Hint 3: During deserialization, use a queue. The first element is the root. For each node, its children are the next elements in the array.",
    ],
    stubs: {
      javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
var serialize = function(root) {
  
};
var deserialize = function(data) {
  
};`,
      python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Codec:
    def serialize(self, root):
        pass
    
    def deserialize(self, data):
        pass`,
      java: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 *     TreeNode(int val, TreeNode left, TreeNode right) {
 *         this.val = val;
 *         this.left = left;
 *         this.right = right;
 *     }
 * }
 */
public class Codec {
    public String serialize(TreeNode root) {
        
    }
    public TreeNode deserialize(String data) {
        
    }
}`,
      cpp: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Codec {
public:
    string serialize(TreeNode* root) {
        
    }
    TreeNode* deserialize(string data) {
        
    }
};`,
      go: `/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
type Codec struct {
    
}
func (c *Codec) Serialize(root *TreeNode) string {
    
}
func (c *Codec) Deserialize(data string) *TreeNode {
    
}`,
      typescript: `/**
 * Definition for a binary tree node.
 * class TreeNode {
 *     val: number
 *     left: TreeNode | null
 *     right: TreeNode | null
 *     constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
 *         this.val = (val===undefined ? 0 : val)
 *         this.left = (left===undefined ? null : left)
 *         this.right = (right===undefined ? null : right)
 *     }
 * }
 */
function serialize(root: TreeNode | null): (number | null)[] {
    
}
function deserialize(data: (number | null)[]): TreeNode | null {
    
}`,
    },
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
    console.log('Connected to MongoDB');

    // Sync indexes - this will recreate them according to the schema
    await Problem.syncIndexes();
    console.log('Indexes synced');

    // Clear existing problems
    await Problem.deleteMany({});

    // Insert all problems
    const result = await Problem.insertMany(problems);
    console.log(`Inserted ${result.length} problems`);

    console.log('Problem seed complete.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
