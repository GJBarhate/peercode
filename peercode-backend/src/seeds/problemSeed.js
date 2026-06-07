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
      { input: '[2,5,5,11]\n10', expectedOutput: '[0,2]' },
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
        output: '3',
        explanation: '25 + 11 = 36. The minimum is 2 coins... wait, 25+11=36, that is 2 coins.',
      },
      {
        input: 'coins = [2], amount = 3',
        output: '-1',
        explanation: 'It is impossible to make 3 using only coins of denomination 2.',
      },
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
