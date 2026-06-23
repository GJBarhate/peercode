export const PROBLEM_STARTER_CODE = {
  'two-sum': {
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
  // Your solution here
  return [];
};`,
    typescript: `function twoSum(nums: number[], target: number): number[] {
  // Your solution here
  return [];
}`,
    python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Your solution here
        return []`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your solution here
        return new int[] {};
    }
}`,
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your solution here
        return {};
    }
};`,
    go: `func twoSum(nums []int, target int) []int {
    // Your solution here
    return []int{}
}`
  },

  'valid-parentheses': {
    javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
  // Your solution here
  return false;
};`,
    typescript: `function isValid(s: string): boolean {
  // Your solution here
  return false;
}`,
    python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Your solution here
        return False`,
    java: `class Solution {
    public boolean isValid(String s) {
        // Your solution here
        return false;
    }
}`,
    cpp: `class Solution {
public:
    bool isValid(string s) {
        // Your solution here
        return false;
    }
};`,
    go: `func isValid(s string) bool {
    // Your solution here
    return false
}`
  },

  'best-time-to-buy-and-sell-stock': {
    javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
  // Your solution here
  return 0;
};`,
    typescript: `function maxProfit(prices: number[]): number {
  // Your solution here
  return 0;
}`,
    python: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        # Your solution here
        return 0`,
    java: `class Solution {
    public int maxProfit(int[] prices) {
        // Your solution here
        return 0;
    }
}`,
    cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // Your solution here
        return 0;
    }
};`,
    go: `func maxProfit(prices []int) int {
    // Your solution here
    return 0
}`
  },

  'maximum-subarray': {
    javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {
  // Your solution here
  return 0;
};`,
    typescript: `function maxSubArray(nums: number[]): number {
  // Your solution here
  return 0;
}`,
    python: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        # Your solution here
        return 0`,
    java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Your solution here
        return 0;
    }
}`,
    cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Your solution here
        return 0;
    }
};`,
    go: `func maxSubArray(nums []int) int {
    // Your solution here
    return 0
}`
  },

  'number-of-islands': {
    javascript: `/**
 * @param {character[][]} grid
 * @return {number}
 */
var numIslands = function(grid) {
  // Your solution here
  return 0;
};`,
    typescript: `function numIslands(grid: string[][]): number {
  // Your solution here
  return 0;
}`,
    python: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        # Your solution here
        return 0`,
    java: `class Solution {
    public int numIslands(char[][] grid) {
        // Your solution here
        return 0;
    }
}`,
    cpp: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        // Your solution here
        return 0;
    }
};`,
    go: `func numIslands(grid [][]byte) int {
    // Your solution here
    return 0
}`
  },

  'lru-cache': {
    javascript: `/**
 * @param {number} capacity
 */
var LRUCache = function(capacity) {
  // Your solution here
};

/**
 * @param {number} key
 * @return {number}
 */
LRUCache.prototype.get = function(key) {
  // Your solution here
  return -1;
};

/**
 * @param {number} key
 * @param {number} value
 * @return {void}
 */
LRUCache.prototype.put = function(key, value) {
  // Your solution here
};`,
    typescript: `class LRUCache {
  constructor(capacity: number) {
    // Your solution here
  }

  get(key: number): number {
    // Your solution here
    return -1;
  }

  put(key: number, value: number): void {
    // Your solution here
  }
}`,
    python: `class LRUCache:
    def __init__(self, capacity: int):
        # Your solution here
        pass

    def get(self, key: int) -> int:
        # Your solution here
        return -1

    def put(self, key: int, value: int) -> None:
        # Your solution here
        pass`,
    java: `class LRUCache {
    public LRUCache(int capacity) {
        // Your solution here
    }

    public int get(int key) {
        // Your solution here
        return -1;
    }

    public void put(int key, int value) {
        // Your solution here
    }
}`,
    cpp: `class LRUCache {
public:
    LRUCache(int capacity) {
        // Your solution here
    }

    int get(int key) {
        // Your solution here
        return -1;
    }

    void put(int key, int value) {
        // Your solution here
    }
};`,
    go: `type LRUCache struct {
    // Your solution here
}

func Constructor(capacity int) LRUCache {
    // Your solution here
    return LRUCache{}
}

func (this *LRUCache) Get(key int) int {
    // Your solution here
    return -1
}

func (this *LRUCache) Put(key int, value int) {
    // Your solution here
}`
  },

  'word-break': {
    javascript: `/**
 * @param {string} s
 * @param {string[]} wordDict
 * @return {boolean}
 */
var wordBreak = function(s, wordDict) {
  // Your solution here
  return false;
};`,
    typescript: `function wordBreak(s: string, wordDict: string[]): boolean {
  // Your solution here
  return false;
}`,
    python: `class Solution:
    def wordBreak(self, s: str, wordDict: list[str]) -> bool:
        # Your solution here
        return False`,
    java: `class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        // Your solution here
        return false;
    }
}`,
    cpp: `class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        // Your solution here
        return false;
    }
};`,
    go: `func wordBreak(s string, wordDict []string) bool {
    // Your solution here
    return false
}`
  },

  'merge-intervals': {
    javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
var merge = function(intervals) {
  // Your solution here
  return [];
};`,
    typescript: `function merge(intervals: number[][]): number[][] {
  // Your solution here
  return [];
}`,
    python: `class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        # Your solution here
        return []`,
    java: `class Solution {
    public int[][] merge(int[][] intervals) {
        // Your solution here
        return new int[][] {};
    }
}`,
    cpp: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        // Your solution here
        return {};
    }
};`,
    go: `func merge(intervals [][]int) [][]int {
    // Your solution here
    return [][]int{}
}`
  },

  'binary-tree-level-order-traversal': {
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
  // Your solution here
  return [];
};`,
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
function levelOrder(root: TreeNode | null): number[][] {
  // Your solution here
  return [];
}`,
    python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def levelOrder(self, root) -> list[list[int]]:
        # Your solution here
        return []`,
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
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        // Your solution here
        return new ArrayList<>();
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
class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        // Your solution here
        return {};
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
func levelOrder(root *TreeNode) [][]int {
    // Your solution here
    return [][]int{}
}`
  },

  'coin-change': {
    javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
var coinChange = function(coins, amount) {
  // Your solution here
  return -1;
};`,
    typescript: `function coinChange(coins: number[], amount: number): number {
  // Your solution here
  return -1;
}`,
    python: `class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        # Your solution here
        return -1`,
    java: `class Solution {
    public int coinChange(int[] coins, int amount) {
        // Your solution here
        return -1;
    }
}`,
    cpp: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        // Your solution here
        return -1;
    }
};`,
    go: `func coinChange(coins []int, amount int) int {
    // Your solution here
    return -1
}`
  },

  'longest-substring-without-repeating-characters': {
    javascript: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
  // Your solution here
  return 0;
};`,
    typescript: `function lengthOfLongestSubstring(s: string): number {
  // Your solution here
  return 0;
}`,
    python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Your solution here
        return 0`,
    java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Your solution here
        return 0;
    }
}`,
    cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Your solution here
        return 0;
    }
};`,
    go: `func lengthOfLongestSubstring(s string) int {
    // Your solution here
    return 0
}`
  },

  'house-robber': {
    javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var rob = function(nums) {
  // Your solution here
  return 0;
};`,
    typescript: `function rob(nums: number[]): number {
  // Your solution here
  return 0;
}`,
    python: `class Solution:
    def rob(self, nums: list[int]) -> int:
        # Your solution here
        return 0`,
    java: `class Solution {
    public int rob(int[] nums) {
        // Your solution here
        return 0;
    }
}`,
    cpp: `class Solution {
public:
    int rob(vector<int>& nums) {
        // Your solution here
        return 0;
    }
};`,
    go: `func rob(nums []int) int {
    // Your solution here
    return 0
}`
  },

  'course-schedule': {
    javascript: `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @return {boolean}
 */
var canFinish = function(numCourses, prerequisites) {
  // Your solution here
  return false;
};`,
    typescript: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  // Your solution here
  return false;
}`,
    python: `class Solution:
    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:
        # Your solution here
        return False`,
    java: `class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        // Your solution here
        return false;
    }
}`,
    cpp: `class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        // Your solution here
        return false;
    }
};`,
    go: `func canFinish(numCourses int, prerequisites [][]int) bool {
    // Your solution here
    return false
}`
  },

  '3sum': {
    javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var threeSum = function(nums) {
  // Your solution here
  return [];
};`,
    typescript: `function threeSum(nums: number[]): number[][] {
  // Your solution here
  return [];
}`,
    python: `class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        # Your solution here
        return []`,
    java: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        // Your solution here
        return new ArrayList<>();
    }
}`,
    cpp: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        // Your solution here
        return {};
    }
};`,
    go: `func threeSum(nums []int) [][]int {
    // Your solution here
    return [][]int{}
}`
  },

  'trapping-rain-water': {
    javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
var trap = function(height) {
  // Your solution here
  return 0;
};`,
    typescript: `function trap(height: number[]): number {
  // Your solution here
  return 0;
}`,
    python: `class Solution:
    def trap(self, height: list[int]) -> int:
        # Your solution here
        return 0`,
    java: `class Solution {
    public int trap(int[] height) {
        // Your solution here
        return 0;
    }
}`,
    cpp: `class Solution {
public:
    int trap(vector<int>& height) {
        // Your solution here
        return 0;
    }
};`,
    go: `func trap(height []int) int {
    // Your solution here
    return 0
}`
  },

  'pacific-atlantic-water-flow': {
    javascript: `/**
 * @param {number[][]} heights
 * @return {number[][]}
 */
var pacificAtlantic = function(heights) {
  // Your solution here
  return [];
};`,
    typescript: `function pacificAtlantic(heights: number[][]): number[][] {
  // Your solution here
  return [];
}`,
    python: `class Solution:
    def pacificAtlantic(self, heights: list[list[int]]) -> list[list[int]]:
        # Your solution here
        return []`,
    java: `class Solution {
    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        // Your solution here
        return new ArrayList<>();
    }
}`,
    cpp: `class Solution {
public:
    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {
        // Your solution here
        return {};
    }
};`,
    go: `func pacificAtlantic(heights [][]int) [][]int {
    // Your solution here
    return [][]int{}
}`
  },

  'decode-ways': {
    javascript: `/**
 * @param {string} s
 * @return {number}
 */
var numDecodings = function(s) {
  // Your solution here
  return 0;
};`,
    typescript: `function numDecodings(s: string): number {
  // Your solution here
  return 0;
}`,
    python: `class Solution:
    def numDecodings(self, s: str) -> int:
        # Your solution here
        return 0`,
    java: `class Solution {
    public int numDecodings(String s) {
        // Your solution here
        return 0;
    }
}`,
    cpp: `class Solution {
public:
    int numDecodings(string s) {
        // Your solution here
        return 0;
    }
};`,
    go: `func numDecodings(s string) int {
    // Your solution here
    return 0
}`
  },

  'rotate-image': {
    javascript: `/**
 * @param {number[][]} matrix
 * @return {void} Do not return anything, modify matrix in-place instead.
 */
var rotate = function(matrix) {
  // Your solution here
};`,
    typescript: `/**
 * Do not return anything, modify matrix in-place instead.
 */
function rotate(matrix: number[][]): void {
  // Your solution here
}`,
    python: `class Solution:
    def rotate(self, matrix: list[list[int]]) -> None:
        """
        Do not return anything, modify matrix in-place instead.
        """
        # Your solution here
        pass`,
    java: `class Solution {
    public void rotate(int[][] matrix) {
        // Your solution here
    }
}`,
    cpp: `class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        // Your solution here
    }
};`,
    go: `func rotate(matrix [][]int) {
    // Your solution here
}`
  },

  'word-ladder': {
    javascript: `/**
 * @param {string} beginWord
 * @param {string} endWord
 * @param {string[]} wordList
 * @return {number}
 */
var ladderLength = function(beginWord, endWord, wordList) {
  // Your solution here
  return 0;
};`,
    typescript: `function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  // Your solution here
  return 0;
}`,
    python: `class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: list[str]) -> int:
        # Your solution here
        return 0`,
    java: `class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        // Your solution here
        return 0;
    }
}`,
    cpp: `class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        // Your solution here
        return 0;
    }
};`,
    go: `func ladderLength(beginWord string, endWord string, wordList []string) int {
    // Your solution here
    return 0
}`
  },

  'serialize-and-deserialize-binary-tree': {
    javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val) {
 *     this.val = val;
 *     this.left = this.right = null;
 * }
 */

/**
 * Encodes a tree to a single string.
 *
 * @param {TreeNode} root
 * @return {string}
 */
var serialize = function(root) {
  // Your solution here
  return "";
};

/**
 * Decodes your encoded data to tree.
 *
 * @param {string} data
 * @return {TreeNode}
 */
var deserialize = function(data) {
  // Your solution here
  return null;
};`,
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

/*
 * Encodes a tree to a single string.
 */
function serialize(root: TreeNode | null): string {
  // Your solution here
  return "";
}

/*
 * Decodes your encoded data to tree.
 */
function deserialize(data: string): TreeNode | null {
  // Your solution here
  return null;
}`,
    python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Codec:
    def serialize(self, root) -> str:
        # Your solution here
        return ""

    def deserialize(self, data: str):
        # Your solution here
        return None`,
    java: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode(int x) { val = x; }
 * }
 */
public class Codec {
    // Encodes a tree to a single string.
    public String serialize(TreeNode root) {
        // Your solution here
        return "";
    }

    // Decodes your encoded data to tree.
    public TreeNode deserialize(String data) {
        // Your solution here
        return null;
    }
}`,
    cpp: `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
 * };
 */
class Codec {
public:
    // Encodes a tree to a single string.
    string serialize(TreeNode* root) {
        // Your solution here
        return "";
    }

    // Decodes your encoded data to tree.
    TreeNode* deserialize(string data) {
        // Your solution here
        return nullptr;
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
    // Your solution here
}

func Constructor() Codec {
    return Codec{}
}

// Serializes a tree to a single string.
func (this *Codec) serialize(root *TreeNode) string {
    // Your solution here
    return ""
}

// Deserializes your encoded data to tree.
func (this *Codec) deserialize(data string) *TreeNode {
    // Your solution here
    return nil
}`
  }
};
