export const PROBLEM_SOLUTIONS = {
  'two-sum': {
    javascript: {
      code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a hash map to store each number and its index. For each element, check if the complement (target - current) exists in the map.'
    },
    python: {
      code: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a dictionary to store each number and its index. For each element, check if the complement (target - current) exists in the dictionary.'
    },
    java: {
      code: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a HashMap to store each number and its index. For each element, check if the complement (target - current) exists in the map.'
    },
    cpp: {
      code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.count(complement)) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use an unordered_map to store each number and its index. For each element, check if the complement (target - current) exists in the map.'
    },
    go: {
      code: `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return []int{}
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a map to store each number and its index. For each element, check if the complement (target - current) exists in the map.'
    },
    rust: {
      code: `use std::collections::HashMap;

impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        let mut map = HashMap::new();
        for (i, &num) in nums.iter().enumerate() {
            let complement = target - num;
            if let Some(&j) = map.get(&complement) {
                return vec![j as i32, i as i32];
            }
            map.insert(num, i);
        }
        vec![]
    }
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a HashMap to store each number and its index. For each element, check if the complement (target - current) exists in the map.'
    },
    typescript: {
      code: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a Map to store each number and its index. For each element, check if the complement (target - current) exists in the map.'
    }
  },

  'valid-parentheses': {
    javascript: {
      code: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char in map) {
      if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a stack to track opening brackets. When a closing bracket is encountered, verify it matches the most recent opening bracket on the stack.'
    },
    python: {
      code: `def isValid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return False
        else:
            stack.append(char)
    return len(stack) == 0`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a stack to track opening brackets. When a closing bracket is encountered, verify it matches the most recent opening bracket on the stack.'
    },
    java: {
      code: `class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        Map<Character, Character> map = Map.of(')', '(', '}', '{', ']', '[');
        for (char c : s.toCharArray()) {
            if (map.containsKey(c)) {
                if (stack.isEmpty() || stack.pop() != map.get(c)) {
                    return false;
                }
            } else {
                stack.push(c);
            }
        }
        return stack.isEmpty();
    }
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a stack to track opening brackets. When a closing bracket is encountered, verify it matches the most recent opening bracket on the stack.'
    },
    cpp: {
      code: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        unordered_map<char, char> map = {{')', '('}, {'}', '{'}, {']', '['}};
        for (char c : s) {
            if (map.count(c)) {
                if (st.empty() || st.top() != map[c]) {
                    return false;
                }
                st.pop();
            } else {
                st.push(c);
            }
        }
        return st.empty();
    }
};`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a stack to track opening brackets. When a closing bracket is encountered, verify it matches the most recent opening bracket on the stack.'
    },
    go: {
      code: `func isValid(s string) bool {
    stack := []rune{}
    mapping := map[rune]rune{')': '(', '}': '{', ']': '['}
    for _, c := range s {
        if open, ok := mapping[c]; ok {
            if len(stack) == 0 || stack[len(stack)-1] != open {
                return false
            }
            stack = stack[:len(stack)-1]
        } else {
            stack = append(stack, c)
        }
    }
    return len(stack) == 0
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a slice as a stack to track opening brackets. When a closing bracket is encountered, verify it matches the most recent opening bracket.'
    },
    rust: {
      code: `impl Solution {
    pub fn is_valid(s: String) -> bool {
        let mut stack = Vec::new();
        for c in s.chars() {
            match c {
                '(' | '{' | '[' => stack.push(c),
                ')' => if stack.pop() != Some('(') { return false; },
                '}' => if stack.pop() != Some('{') { return false; },
                ']' => if stack.pop() != Some('[') { return false; },
                _ => {}
            }
        }
        stack.is_empty()
    }
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a Vec as a stack to track opening brackets. Pattern match each character and verify closing brackets match the most recent opening bracket.'
    },
    typescript: {
      code: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char in map) {
      if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use a stack to track opening brackets. When a closing bracket is encountered, verify it matches the most recent opening bracket on the stack.'
    }
  },

  'best-time-to-buy-and-sell-stock': {
    javascript: {
      code: `function maxProfit(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;
  for (const price of prices) {
    minPrice = Math.min(minPrice, price);
    maxProfit = Math.max(maxProfit, price - minPrice);
  }
  return maxProfit;
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Track the minimum price seen so far and compute the maximum profit at each step by comparing the current price minus the minimum.'
    },
    python: {
      code: `def maxProfit(prices):
    min_price = float('inf')
    max_profit = 0
    for price in prices:
        min_price = min(min_price, price)
        max_profit = max(max_profit, price - min_price)
    return max_profit`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Track the minimum price seen so far and compute the maximum profit at each step by comparing the current price minus the minimum.'
    },
    java: {
      code: `class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int maxProfit = 0;
        for (int price : prices) {
            minPrice = Math.min(minPrice, price);
            maxProfit = Math.max(maxProfit, price - minPrice);
        }
        return maxProfit;
    }
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Track the minimum price seen so far and compute the maximum profit at each step by comparing the current price minus the minimum.'
    },
    cpp: {
      code: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = INT_MAX;
        int maxProfit = 0;
        for (int price : prices) {
            minPrice = min(minPrice, price);
            maxProfit = max(maxProfit, price - minPrice);
        }
        return maxProfit;
    }
};`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Track the minimum price seen so far and compute the maximum profit at each step by comparing the current price minus the minimum.'
    },
    go: {
      code: `func maxProfit(prices []int) int {
    minPrice := math.MaxInt32
    maxProfit := 0
    for _, price := range prices {
        if price < minPrice {
            minPrice = price
        }
        if price - minPrice > maxProfit {
            maxProfit = price - minPrice
        }
    }
    return maxProfit
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Track the minimum price seen so far and compute the maximum profit at each step by comparing the current price minus the minimum.'
    },
    rust: {
      code: `impl Solution {
    pub fn max_profit(prices: Vec<i32>) -> i32 {
        let mut min_price = i32::MAX;
        let mut max_profit = 0;
        for price in prices {
            min_price = min_price.min(price);
            max_profit = max_profit.max(price - min_price);
        }
        max_profit
    }
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Track the minimum price seen so far and compute the maximum profit at each step by comparing the current price minus the minimum.'
    },
    typescript: {
      code: `function maxProfit(prices: number[]): number {
  let minPrice = Infinity;
  let maxProfit = 0;
  for (const price of prices) {
    minPrice = Math.min(minPrice, price);
    maxProfit = Math.max(maxProfit, price - minPrice);
  }
  return maxProfit;
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Track the minimum price seen so far and compute the maximum profit at each step by comparing the current price minus the minimum.'
    }
  },

  'maximum-subarray': {
    javascript: {
      code: `function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Kadane\'s algorithm: at each position, decide whether to extend the current subarray or start a new one, tracking the global maximum throughout.'
    },
    python: {
      code: `def maxSubArray(nums):
    max_sum = nums[0]
    current_sum = nums[0]
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    return max_sum`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Kadane\'s algorithm: at each position, decide whether to extend the current subarray or start a new one, tracking the global maximum throughout.'
    },
    java: {
      code: `class Solution {
    public int maxSubArray(int[] nums) {
        int maxSum = nums[0];
        int currentSum = nums[0];
        for (int i = 1; i < nums.length; i++) {
            currentSum = Math.max(nums[i], currentSum + nums[i]);
            maxSum = Math.max(maxSum, currentSum);
        }
        return maxSum;
    }
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Kadane\'s algorithm: at each position, decide whether to extend the current subarray or start a new one, tracking the global maximum throughout.'
    },
    cpp: {
      code: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxSum = nums[0];
        int currentSum = nums[0];
        for (int i = 1; i < nums.size(); i++) {
            currentSum = max(nums[i], currentSum + nums[i]);
            maxSum = max(maxSum, currentSum);
        }
        return maxSum;
    }
};`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Kadane\'s algorithm: at each position, decide whether to extend the current subarray or start a new one, tracking the global maximum throughout.'
    },
    go: {
      code: `func maxSubArray(nums []int) int {
    maxSum := nums[0]
    currentSum := nums[0]
    for _, num := range nums[1:] {
        if currentSum + num > num {
            currentSum = currentSum + num
        } else {
            currentSum = num
        }
        if currentSum > maxSum {
            maxSum = currentSum
        }
    }
    return maxSum
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Kadane\'s algorithm: at each position, decide whether to extend the current subarray or start a new one, tracking the global maximum throughout.'
    },
    rust: {
      code: `impl Solution {
    pub fn max_sub_array(nums: Vec<i32>) -> i32 {
        let mut max_sum = nums[0];
        let mut current_sum = nums[0];
        for &num in &nums[1..] {
            current_sum = num.max(current_sum + num);
            max_sum = max_sum.max(current_sum);
        }
        max_sum
    }
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Kadane\'s algorithm: at each position, decide whether to extend the current subarray or start a new one, tracking the global maximum throughout.'
    },
    typescript: {
      code: `function maxSubArray(nums: number[]): number {
  let maxSum = nums[0];
  let currentSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Kadane\'s algorithm: at each position, decide whether to extend the current subarray or start a new one, tracking the global maximum throughout.'
    }
  },

  'number-of-islands': {
    javascript: {
      code: `function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;
  let count = 0;
  const rows = grid.length;
  const cols = grid[0].length;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') return;
    grid[r][c] = '0';
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }
  return count;
}`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Iterate through the grid and when a land cell is found, increment the count and use DFS to mark all connected land cells as visited by setting them to zero.'
    },
    python: {
      code: `def numIslands(grid):
    if not grid:
        return 0
    count = 0
    rows, cols = len(grid), len(grid[0])

    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] == '0':
            return
        grid[r][c] = '0'
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                count += 1
                dfs(r, c)
    return count`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Iterate through the grid and when a land cell is found, increment the count and use DFS to mark all connected land cells as visited by setting them to zero.'
    },
    java: {
      code: `class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int count = 0;
        int rows = grid.length, cols = grid[0].length;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    dfs(grid, r, c, rows, cols);
                }
            }
        }
        return count;
    }

    private void dfs(char[][] grid, int r, int c, int rows, int cols) {
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] == '0') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c, rows, cols);
        dfs(grid, r - 1, c, rows, cols);
        dfs(grid, r, c + 1, rows, cols);
        dfs(grid, r, c - 1, rows, cols);
    }
}`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Iterate through the grid and when a land cell is found, increment the count and use DFS to mark all connected land cells as visited by setting them to zero.'
    },
    cpp: {
      code: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        if (grid.empty()) return 0;
        int count = 0;
        int rows = grid.size(), cols = grid[0].size();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    dfs(grid, r, c, rows, cols);
                }
            }
        }
        return count;
    }

    void dfs(vector<vector<char>>& grid, int r, int c, int rows, int cols) {
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] == '0') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c, rows, cols);
        dfs(grid, r - 1, c, rows, cols);
        dfs(grid, r, c + 1, rows, cols);
        dfs(grid, r, c - 1, rows, cols);
    }
};`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Iterate through the grid and when a land cell is found, increment the count and use DFS to mark all connected land cells as visited by setting them to zero.'
    },
    go: {
      code: `func numIslands(grid [][]byte) int {
    if len(grid) == 0 {
        return 0
    }
    count := 0
    rows, cols := len(grid), len(grid[0])

    var dfs func(r, c int)
    dfs = func(r, c int) {
        if r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] == '0' {
            return
        }
        grid[r][c] = '0'
        dfs(r+1, c)
        dfs(r-1, c)
        dfs(r, c+1)
        dfs(r, c-1)
    }

    for r := 0; r < rows; r++ {
        for c := 0; c < cols; c++ {
            if grid[r][c] == '1' {
                count++
                dfs(r, c)
            }
        }
    }
    return count
}`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Iterate through the grid and when a land cell is found, increment the count and use DFS to mark all connected land cells as visited by setting them to zero.'
    },
    rust: {
      code: `impl Solution {
    pub fn num_islands(mut grid: Vec<Vec<char>>) -> i32 {
        if grid.is_empty() {
            return 0;
        }
        let mut count = 0;
        let rows = grid.len();
        let cols = grid[0].len();
        for r in 0..rows {
            for c in 0..cols {
                if grid[r][c] == '1' {
                    count += 1;
                    Self::dfs(&mut grid, r as i32, c as i32, rows as i32, cols as i32);
                }
            }
        }
        count
    }

    fn dfs(grid: &mut Vec<Vec<char>>, r: i32, c: i32, rows: i32, cols: i32) {
        if r < 0 || r >= rows || c < 0 || c >= cols || grid[r as usize][c as usize] == '0' {
            return;
        }
        grid[r as usize][c as usize] = '0';
        Self::dfs(grid, r + 1, c, rows, cols);
        Self::dfs(grid, r - 1, c, rows, cols);
        Self::dfs(grid, r, c + 1, rows, cols);
        Self::dfs(grid, r, c - 1, rows, cols);
    }
}`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Iterate through the grid and when a land cell is found, increment the count and use DFS to mark all connected land cells as visited by setting them to zero.'
    },
    typescript: {
      code: `function numIslands(grid: string[][]): number {
  if (!grid || grid.length === 0) return 0;
  let count = 0;
  const rows = grid.length;
  const cols = grid[0].length;

  function dfs(r: number, c: number): void {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') return;
    grid[r][c] = '0';
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }
  return count;
}`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Iterate through the grid and when a land cell is found, increment the count and use DFS to mark all connected land cells as visited by setting them to zero.'
    }
  },

  'lru-cache': {
    javascript: {
      code: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}`,
      complexity: 'Time: O(1) per operation, Space: O(capacity)',
      explanation: 'Use a Map which maintains insertion order. On access, delete and re-insert to move to the end. On capacity overflow, delete the first (oldest) key.'
    },
    python: {
      code: `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`,
      complexity: 'Time: O(1) per operation, Space: O(capacity)',
      explanation: 'Use an OrderedDict to maintain access order. move_to_end on access, popitem(last=False) to evict the least recently used when over capacity.'
    },
    java: {
      code: `class LRUCache {
    private int capacity;
    private Map<Integer, Node> map;
    private Node head, tail;

    private class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { key = k; value = v; }
    }

    public LRUCache(int capacity) {
        this.capacity = capacity;
        map = new HashMap<>();
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        remove(node);
        insertEnd(node);
        return node.value;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) {
            remove(map.get(key));
        }
        Node node = new Node(key, value);
        map.put(key, node);
        insertEnd(node);
        if (map.size() > capacity) {
            Node lru = head.next;
            remove(lru);
            map.remove(lru.key);
        }
    }

    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void insertEnd(Node node) {
        node.prev = tail.prev;
        node.next = tail;
        tail.prev.next = node;
        tail.prev = node;
    }
}`,
      complexity: 'Time: O(1) per operation, Space: O(capacity)',
      explanation: 'Combine a HashMap for O(1) lookups with a doubly linked list for O(1) insertion and removal, maintaining access order with sentinel head and tail nodes.'
    },
    cpp: {
      code: `class LRUCache {
    int capacity;
    list<pair<int, int>> lruList;
    unordered_map<int, list<pair<int, int>>::iterator> map;

public:
    LRUCache(int capacity) : capacity(capacity) {}

    int get(int key) {
        if (map.find(key) == map.end()) return -1;
        lruList.splice(lruList.begin(), lruList, map[key]);
        return map[key]->second;
    }

    void put(int key, int value) {
        if (map.find(key) != map.end()) {
            lruList.splice(lruList.begin(), lruList, map[key]);
            map[key]->second = value;
            return;
        }
        if (lruList.size() == capacity) {
            int lruKey = lruList.back().first;
            lruList.pop_back();
            map.erase(lruKey);
        }
        lruList.push_front({key, value});
        map[key] = lruList.begin();
    }
};`,
      complexity: 'Time: O(1) per operation, Space: O(capacity)',
      explanation: 'Combine an unordered_map for O(1) lookups with a std::list for O(1) splice operations, moving accessed elements to the front and evicting from the back.'
    },
    go: {
      code: `type entry struct {
    key, value int
}

type LRUCache struct {
    capacity int
    list     *list.List
    items    map[int]*list.Element
}

func Constructor(capacity int) LRUCache {
    return LRUCache{
        capacity: capacity,
        list:     list.New(),
        items:    make(map[int]*list.Element),
    }
}

func (c *LRUCache) Get(key int) int {
    if elem, ok := c.items[key]; ok {
        c.list.MoveToFront(elem)
        return elem.Value.(*entry).value
    }
    return -1
}

func (c *LRUCache) Put(key int, value int) {
    if elem, ok := c.items[key]; ok {
        c.list.MoveToFront(elem)
        elem.Value.(*entry).value = value
        return
    }
    if c.list.Len() == c.capacity {
        back := c.list.Back()
        c.list.Remove(back)
        delete(c.items, back.Value.(*entry).key)
    }
    elem := c.list.PushFront(&entry{key, value})
    c.items[key] = elem
}`,
      complexity: 'Time: O(1) per operation, Space: O(capacity)',
      explanation: 'Combine a Go map for O(1) lookups with a container/list doubly linked list for O(1) reordering, moving accessed elements to the front and evicting from the back.'
    },
    rust: {
      code: `use std::collections::HashMap;

struct LRUCache {
    capacity: usize,
    map: HashMap<i32, (i32, usize)>,
    order: Vec<i32>,
    time: usize,
}

impl LRUCache {
    fn new(capacity: i32) -> Self {
        LRUCache {
            capacity: capacity as usize,
            map: HashMap::new(),
            order: Vec::new(),
            time: 0,
        }
    }

    fn get(&mut self, key: i32) -> i32 {
        if let Some(entry) = self.map.get_mut(&key) {
            self.time += 1;
            entry.1 = self.time;
            entry.0
        } else {
            -1
        }
    }

    fn put(&mut self, key: i32, value: i32) {
        self.time += 1;
        if self.map.contains_key(&key) {
            self.map.insert(key, (value, self.time));
            return;
        }
        if self.map.len() == self.capacity {
            let lru_key = *self.map.iter()
                .min_by_key(|entry| entry.1.1)
                .unwrap().0;
            self.map.remove(&lru_key);
        }
        self.map.insert(key, (value, self.time));
    }
}`,
      complexity: 'Time: O(1) amortized get, O(n) put eviction, Space: O(capacity)',
      explanation: 'Use a HashMap storing values with timestamps. On eviction, find the entry with the smallest timestamp. For a true O(1) solution, a linked list crate would be needed.'
    },
    typescript: {
      code: `class LRUCache {
  private capacity: number;
  private cache: Map<number, number>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: number): number {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: number, value: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value!;
      this.cache.delete(firstKey);
    }
  }
}`,
      complexity: 'Time: O(1) per operation, Space: O(capacity)',
      explanation: 'Use a Map which maintains insertion order. On access, delete and re-insert to move to the end. On capacity overflow, delete the first (oldest) key.'
    }
  },

  'word-break': {
    javascript: {
      code: `function wordBreak(s, wordDict) {
  const wordSet = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && wordSet.has(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
}`,
      complexity: 'Time: O(n^2 * m), Space: O(n)',
      explanation: 'Use dynamic programming where dp[i] indicates whether s[0..i] can be segmented. For each position, check all possible previous break points against the dictionary.'
    },
    python: {
      code: `def wordBreak(s, wordDict):
    word_set = set(wordDict)
    dp = [False] * (len(s) + 1)
    dp[0] = True
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
                break
    return dp[len(s)]`,
      complexity: 'Time: O(n^2 * m), Space: O(n)',
      explanation: 'Use dynamic programming where dp[i] indicates whether s[0..i] can be segmented. For each position, check all possible previous break points against the dictionary.'
    },
    java: {
      code: `class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        Set<String> wordSet = new HashSet<>(wordDict);
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;
        for (int i = 1; i <= s.length(); i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && wordSet.contains(s.substring(j, i))) {
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[s.length()];
    }
}`,
      complexity: 'Time: O(n^2 * m), Space: O(n)',
      explanation: 'Use dynamic programming where dp[i] indicates whether s[0..i] can be segmented. For each position, check all possible previous break points against the dictionary.'
    },
    cpp: {
      code: `class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        unordered_set<string> wordSet(wordDict.begin(), wordDict.end());
        vector<bool> dp(s.size() + 1, false);
        dp[0] = true;
        for (int i = 1; i <= s.size(); i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && wordSet.count(s.substr(j, i - j))) {
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[s.size()];
    }
};`,
      complexity: 'Time: O(n^2 * m), Space: O(n)',
      explanation: 'Use dynamic programming where dp[i] indicates whether s[0..i] can be segmented. For each position, check all possible previous break points against the dictionary.'
    },
    go: {
      code: `func wordBreak(s string, wordDict []string) bool {
    wordSet := make(map[string]bool)
    for _, w := range wordDict {
        wordSet[w] = true
    }
    dp := make([]bool, len(s)+1)
    dp[0] = true
    for i := 1; i <= len(s); i++ {
        for j := 0; j < i; j++ {
            if dp[j] && wordSet[s[j:i]] {
                dp[i] = true
                break
            }
        }
    }
    return dp[len(s)]
}`,
      complexity: 'Time: O(n^2 * m), Space: O(n)',
      explanation: 'Use dynamic programming where dp[i] indicates whether s[0..i] can be segmented. For each position, check all possible previous break points against the dictionary.'
    },
    rust: {
      code: `use std::collections::HashSet;

impl Solution {
    pub fn word_break(s: String, word_dict: Vec<String>) -> bool {
        let word_set: HashSet<&str> = word_dict.iter().map(|w| w.as_str()).collect();
        let n = s.len();
        let mut dp = vec![false; n + 1];
        dp[0] = true;
        for i in 1..=n {
            for j in 0..i {
                if dp[j] && word_set.contains(&s[j..i]) {
                    dp[i] = true;
                    break;
                }
            }
        }
        dp[n]
    }
}`,
      complexity: 'Time: O(n^2 * m), Space: O(n)',
      explanation: 'Use dynamic programming where dp[i] indicates whether s[0..i] can be segmented. For each position, check all possible previous break points against the dictionary.'
    },
    typescript: {
      code: `function wordBreak(s: string, wordDict: string[]): boolean {
  const wordSet = new Set(wordDict);
  const dp: boolean[] = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && wordSet.has(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length];
}`,
      complexity: 'Time: O(n^2 * m), Space: O(n)',
      explanation: 'Use dynamic programming where dp[i] indicates whether s[0..i] can be segmented. For each position, check all possible previous break points against the dictionary.'
    }
  },

  'merge-intervals': {
    javascript: {
      code: `function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      merged.push(intervals[i]);
    }
  }
  return merged;
}`,
      complexity: 'Time: O(n log n), Space: O(n)',
      explanation: 'Sort intervals by start time, then iterate and merge overlapping intervals by comparing each interval\'s start with the previous interval\'s end.'
    },
    python: {
      code: `def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
      complexity: 'Time: O(n log n), Space: O(n)',
      explanation: 'Sort intervals by start time, then iterate and merge overlapping intervals by comparing each interval\'s start with the previous interval\'s end.'
    },
    java: {
      code: `class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        List<int[]> merged = new ArrayList<>();
        merged.add(intervals[0]);
        for (int i = 1; i < intervals.length; i++) {
            int[] last = merged.get(merged.size() - 1);
            if (intervals[i][0] <= last[1]) {
                last[1] = Math.max(last[1], intervals[i][1]);
            } else {
                merged.add(intervals[i]);
            }
        }
        return merged.toArray(new int[merged.size()][]);
    }
}`,
      complexity: 'Time: O(n log n), Space: O(n)',
      explanation: 'Sort intervals by start time, then iterate and merge overlapping intervals by comparing each interval\'s start with the previous interval\'s end.'
    },
    cpp: {
      code: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> merged = {intervals[0]};
        for (int i = 1; i < intervals.size(); i++) {
            if (intervals[i][0] <= merged.back()[1]) {
                merged.back()[1] = max(merged.back()[1], intervals[i][1]);
            } else {
                merged.push_back(intervals[i]);
            }
        }
        return merged;
    }
};`,
      complexity: 'Time: O(n log n), Space: O(n)',
      explanation: 'Sort intervals by start time, then iterate and merge overlapping intervals by comparing each interval\'s start with the previous interval\'s end.'
    },
    go: {
      code: `func merge(intervals [][]int) [][]int {
    sort.Slice(intervals, func(i, j int) bool {
        return intervals[i][0] < intervals[j][0]
    })
    merged := [][]int{intervals[0]}
    for _, interval := range intervals[1:] {
        last := merged[len(merged)-1]
        if interval[0] <= last[1] {
            if interval[1] > last[1] {
                last[1] = interval[1]
            }
        } else {
            merged = append(merged, interval)
        }
    }
    return merged
}`,
      complexity: 'Time: O(n log n), Space: O(n)',
      explanation: 'Sort intervals by start time, then iterate and merge overlapping intervals by comparing each interval\'s start with the previous interval\'s end.'
    },
    rust: {
      code: `impl Solution {
    pub fn merge(mut intervals: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
        intervals.sort_by_key(|i| i[0]);
        let mut merged: Vec<Vec<i32>> = vec![intervals[0].clone()];
        for interval in &intervals[1..] {
            let last = merged.last_mut().unwrap();
            if interval[0] <= last[1] {
                last[1] = last[1].max(interval[1]);
            } else {
                merged.push(interval.clone());
            }
        }
        merged
    }
}`,
      complexity: 'Time: O(n log n), Space: O(n)',
      explanation: 'Sort intervals by start time, then iterate and merge overlapping intervals by comparing each interval\'s start with the previous interval\'s end.'
    },
    typescript: {
      code: `function merge(intervals: number[][]): number[][] {
  intervals.sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      merged.push(intervals[i]);
    }
  }
  return merged;
}`,
      complexity: 'Time: O(n log n), Space: O(n)',
      explanation: 'Sort intervals by start time, then iterate and merge overlapping intervals by comparing each interval\'s start with the previous interval\'s end.'
    }
  },

  'binary-tree-level-order-traversal': {
    javascript: {
      code: `function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const levelSize = queue.length;
    const level = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use BFS with a queue. Process nodes level by level, tracking the size of each level to group nodes into separate arrays.'
    },
    python: {
      code: `def levelOrder(root):
    if not root:
        return []
    result = []
    queue = deque([root])
    while queue:
        level_size = len(queue)
        level = []
        for _ in range(level_size):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use BFS with a deque. Process nodes level by level, tracking the size of each level to group nodes into separate lists.'
    },
    java: {
      code: `class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            result.add(level);
        }
        return result;
    }
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use BFS with a queue. Process nodes level by level, tracking the size of each level to group nodes into separate lists.'
    },
    cpp: {
      code: `class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> result;
        if (!root) return result;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            int levelSize = q.size();
            vector<int> level;
            for (int i = 0; i < levelSize; i++) {
                TreeNode* node = q.front();
                q.pop();
                level.push_back(node->val);
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            result.push_back(level);
        }
        return result;
    }
};`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use BFS with a queue. Process nodes level by level, tracking the size of each level to group nodes into separate vectors.'
    },
    go: {
      code: `func levelOrder(root *TreeNode) [][]int {
    if root == nil {
        return [][]int{}
    }
    result := [][]int{}
    queue := []*TreeNode{root}
    for len(queue) > 0 {
        levelSize := len(queue)
        level := []int{}
        for i := 0; i < levelSize; i++ {
            node := queue[0]
            queue = queue[1:]
            level = append(level, node.Val)
            if node.Left != nil {
                queue = append(queue, node.Left)
            }
            if node.Right != nil {
                queue = append(queue, node.Right)
            }
        }
        result = append(result, level)
    }
    return result
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use BFS with a slice as a queue. Process nodes level by level, tracking the size of each level to group nodes into separate slices.'
    },
    rust: {
      code: `use std::rc::Rc;
use std::cell::RefCell;
use std::collections::VecDeque;

impl Solution {
    pub fn level_order(root: Option<Rc<RefCell<TreeNode>>>) -> Vec<Vec<i32>> {
        let mut result = vec![];
        if root.is_none() {
            return result;
        }
        let mut queue = VecDeque::new();
        queue.push_back(root.unwrap());
        while !queue.is_empty() {
            let level_size = queue.len();
            let mut level = vec![];
            for _ in 0..level_size {
                let node = queue.pop_front().unwrap();
                let node_ref = node.borrow();
                level.push(node_ref.val);
                if let Some(left) = node_ref.left.clone() {
                    queue.push_back(left);
                }
                if let Some(right) = node_ref.right.clone() {
                    queue.push_back(right);
                }
            }
            result.push(level);
        }
        result
    }
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use BFS with a VecDeque. Process nodes level by level, tracking the size of each level to group node values into separate vectors.'
    },
    typescript: {
      code: `function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const result: number[][] = [];
  const queue: TreeNode[] = [root];
  while (queue.length > 0) {
    const levelSize = queue.length;
    const level: number[] = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use BFS with a queue. Process nodes level by level, tracking the size of each level to group nodes into separate arrays.'
    }
  },

  'coin-change': {
    javascript: {
      code: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      complexity: 'Time: O(amount * n), Space: O(amount)',
      explanation: 'Use bottom-up dynamic programming where dp[i] stores the minimum coins needed for amount i. For each amount, try every coin and take the minimum.'
    },
    python: {
      code: `def coinChange(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1`,
      complexity: 'Time: O(amount * n), Space: O(amount)',
      explanation: 'Use bottom-up dynamic programming where dp[i] stores the minimum coins needed for amount i. For each amount, try every coin and take the minimum.'
    },
    java: {
      code: `class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) {
                    dp[i] = Math.min(dp[i], dp[i - coin] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
      complexity: 'Time: O(amount * n), Space: O(amount)',
      explanation: 'Use bottom-up dynamic programming where dp[i] stores the minimum coins needed for amount i. For each amount, try every coin and take the minimum.'
    },
    cpp: {
      code: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        vector<int> dp(amount + 1, amount + 1);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) {
                    dp[i] = min(dp[i], dp[i - coin] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`,
      complexity: 'Time: O(amount * n), Space: O(amount)',
      explanation: 'Use bottom-up dynamic programming where dp[i] stores the minimum coins needed for amount i. For each amount, try every coin and take the minimum.'
    },
    go: {
      code: `func coinChange(coins []int, amount int) int {
    dp := make([]int, amount+1)
    for i := range dp {
        dp[i] = amount + 1
    }
    dp[0] = 0
    for i := 1; i <= amount; i++ {
        for _, coin := range coins {
            if coin <= i && dp[i-coin]+1 < dp[i] {
                dp[i] = dp[i-coin] + 1
            }
        }
    }
    if dp[amount] > amount {
        return -1
    }
    return dp[amount]
}`,
      complexity: 'Time: O(amount * n), Space: O(amount)',
      explanation: 'Use bottom-up dynamic programming where dp[i] stores the minimum coins needed for amount i. For each amount, try every coin and take the minimum.'
    },
    rust: {
      code: `impl Solution {
    pub fn coin_change(coins: Vec<i32>, amount: i32) -> i32 {
        let amount = amount as usize;
        let mut dp = vec![amount + 1; amount + 1];
        dp[0] = 0;
        for i in 1..=amount {
            for &coin in &coins {
                let coin = coin as usize;
                if coin <= i && dp[i - coin] + 1 < dp[i] {
                    dp[i] = dp[i - coin] + 1;
                }
            }
        }
        if dp[amount] > amount { -1 } else { dp[amount] as i32 }
    }
}`,
      complexity: 'Time: O(amount * n), Space: O(amount)',
      explanation: 'Use bottom-up dynamic programming where dp[i] stores the minimum coins needed for amount i. For each amount, try every coin and take the minimum.'
    },
    typescript: {
      code: `function coinChange(coins: number[], amount: number): number {
  const dp: number[] = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
      complexity: 'Time: O(amount * n), Space: O(amount)',
      explanation: 'Use bottom-up dynamic programming where dp[i] stores the minimum coins needed for amount i. For each amount, try every coin and take the minimum.'
    }
  },

  'longest-substring-without-repeating-characters': {
    javascript: {
      code: `function lengthOfLongestSubstring(s) {
  const map = new Map();
  let maxLen = 0;
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]) && map.get(s[right]) >= left) {
      left = map.get(s[right]) + 1;
    }
    map.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
      complexity: 'Time: O(n), Space: O(min(n, m))',
      explanation: 'Use a sliding window with a hash map tracking the last index of each character. When a duplicate is found, move the left pointer past the previous occurrence.'
    },
    python: {
      code: `def lengthOfLongestSubstring(s):
    char_index = {}
    max_len = 0
    left = 0
    for right, char in enumerate(s):
        if char in char_index and char_index[char] >= left:
            left = char_index[char] + 1
        char_index[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len`,
      complexity: 'Time: O(n), Space: O(min(n, m))',
      explanation: 'Use a sliding window with a dictionary tracking the last index of each character. When a duplicate is found, move the left pointer past the previous occurrence.'
    },
    java: {
      code: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> map = new HashMap<>();
        int maxLen = 0;
        int left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (map.containsKey(c) && map.get(c) >= left) {
                left = map.get(c) + 1;
            }
            map.put(c, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
      complexity: 'Time: O(n), Space: O(min(n, m))',
      explanation: 'Use a sliding window with a HashMap tracking the last index of each character. When a duplicate is found, move the left pointer past the previous occurrence.'
    },
    cpp: {
      code: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> map;
        int maxLen = 0;
        int left = 0;
        for (int right = 0; right < s.size(); right++) {
            if (map.count(s[right]) && map[s[right]] >= left) {
                left = map[s[right]] + 1;
            }
            map[s[right]] = right;
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
      complexity: 'Time: O(n), Space: O(min(n, m))',
      explanation: 'Use a sliding window with an unordered_map tracking the last index of each character. When a duplicate is found, move the left pointer past the previous occurrence.'
    },
    go: {
      code: `func lengthOfLongestSubstring(s string) int {
    charIndex := make(map[byte]int)
    maxLen := 0
    left := 0
    for right := 0; right < len(s); right++ {
        if idx, ok := charIndex[s[right]]; ok && idx >= left {
            left = idx + 1
        }
        charIndex[s[right]] = right
        if right-left+1 > maxLen {
            maxLen = right - left + 1
        }
    }
    return maxLen
}`,
      complexity: 'Time: O(n), Space: O(min(n, m))',
      explanation: 'Use a sliding window with a map tracking the last index of each character. When a duplicate is found, move the left pointer past the previous occurrence.'
    },
    rust: {
      code: `use std::collections::HashMap;

impl Solution {
    pub fn length_of_longest_substring(s: String) -> i32 {
        let mut char_index = HashMap::new();
        let mut max_len = 0;
        let mut left: i32 = 0;
        let bytes = s.as_bytes();
        for right in 0..bytes.len() {
            if let Some(&idx) = char_index.get(&bytes[right]) {
                if idx >= left {
                    left = idx + 1;
                }
            }
            char_index.insert(bytes[right], right as i32);
            max_len = max_len.max(right as i32 - left + 1);
        }
        max_len
    }
}`,
      complexity: 'Time: O(n), Space: O(min(n, m))',
      explanation: 'Use a sliding window with a HashMap tracking the last index of each byte. When a duplicate is found, move the left pointer past the previous occurrence.'
    },
    typescript: {
      code: `function lengthOfLongestSubstring(s: string): number {
  const map = new Map<string, number>();
  let maxLen = 0;
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]) && map.get(s[right])! >= left) {
      left = map.get(s[right])! + 1;
    }
    map.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
      complexity: 'Time: O(n), Space: O(min(n, m))',
      explanation: 'Use a sliding window with a Map tracking the last index of each character. When a duplicate is found, move the left pointer past the previous occurrence.'
    }
  },

  'house-robber': {
    javascript: {
      code: `function rob(nums) {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];
  let prev2 = 0;
  let prev1 = 0;
  for (const num of nums) {
    const temp = Math.max(prev1, prev2 + num);
    prev2 = prev1;
    prev1 = temp;
  }
  return prev1;
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming with two variables tracking the max profit including or excluding the previous house. At each house, choose the maximum of robbing it plus two houses back, or skipping it.'
    },
    python: {
      code: `def rob(nums):
    prev2, prev1 = 0, 0
    for num in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + num)
    return prev1`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming with two variables tracking the max profit including or excluding the previous house. At each house, choose the maximum of robbing it plus two houses back, or skipping it.'
    },
    java: {
      code: `class Solution {
    public int rob(int[] nums) {
        int prev2 = 0, prev1 = 0;
        for (int num : nums) {
            int temp = Math.max(prev1, prev2 + num);
            prev2 = prev1;
            prev1 = temp;
        }
        return prev1;
    }
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming with two variables tracking the max profit including or excluding the previous house. At each house, choose the maximum of robbing it plus two houses back, or skipping it.'
    },
    cpp: {
      code: `class Solution {
public:
    int rob(vector<int>& nums) {
        int prev2 = 0, prev1 = 0;
        for (int num : nums) {
            int temp = max(prev1, prev2 + num);
            prev2 = prev1;
            prev1 = temp;
        }
        return prev1;
    }
};`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming with two variables tracking the max profit including or excluding the previous house. At each house, choose the maximum of robbing it plus two houses back, or skipping it.'
    },
    go: {
      code: `func rob(nums []int) int {
    prev2, prev1 := 0, 0
    for _, num := range nums {
        temp := prev1
        if prev2+num > prev1 {
            temp = prev2 + num
        }
        prev2 = prev1
        prev1 = temp
    }
    return prev1
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming with two variables tracking the max profit including or excluding the previous house. At each house, choose the maximum of robbing it plus two houses back, or skipping it.'
    },
    rust: {
      code: `impl Solution {
    pub fn rob(nums: Vec<i32>) -> i32 {
        let mut prev2 = 0;
        let mut prev1 = 0;
        for &num in &nums {
            let temp = prev1.max(prev2 + num);
            prev2 = prev1;
            prev1 = temp;
        }
        prev1
    }
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming with two variables tracking the max profit including or excluding the previous house. At each house, choose the maximum of robbing it plus two houses back, or skipping it.'
    },
    typescript: {
      code: `function rob(nums: number[]): number {
  let prev2 = 0;
  let prev1 = 0;
  for (const num of nums) {
    const temp = Math.max(prev1, prev2 + num);
    prev2 = prev1;
    prev1 = temp;
  }
  return prev1;
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming with two variables tracking the max profit including or excluding the previous house. At each house, choose the maximum of robbing it plus two houses back, or skipping it.'
    }
  },

  'course-schedule': {
    javascript: {
      code: `function canFinish(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  const inDegree = new Array(numCourses).fill(0);
  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
    inDegree[course]++;
  }
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  let count = 0;
  while (queue.length > 0) {
    const node = queue.shift();
    count++;
    for (const neighbor of graph[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }
  return count === numCourses;
}`,
      complexity: 'Time: O(V + E), Space: O(V + E)',
      explanation: 'Use topological sort via Kahn\'s algorithm (BFS). Build an adjacency list and in-degree array, process nodes with zero in-degree, and check if all nodes are visited.'
    },
    python: {
      code: `def canFinish(numCourses, prerequisites):
    graph = [[] for _ in range(numCourses)]
    in_degree = [0] * numCourses
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        in_degree[course] += 1
    queue = deque([i for i in range(numCourses) if in_degree[i] == 0])
    count = 0
    while queue:
        node = queue.popleft()
        count += 1
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    return count == numCourses`,
      complexity: 'Time: O(V + E), Space: O(V + E)',
      explanation: 'Use topological sort via Kahn\'s algorithm (BFS). Build an adjacency list and in-degree array, process nodes with zero in-degree, and check if all nodes are visited.'
    },
    java: {
      code: `class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        int[] inDegree = new int[numCourses];
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        for (int[] pre : prerequisites) {
            graph.get(pre[1]).add(pre[0]);
            inDegree[pre[0]]++;
        }
        Queue<Integer> queue = new LinkedList<>();
        for (int i = 0; i < numCourses; i++) {
            if (inDegree[i] == 0) queue.offer(i);
        }
        int count = 0;
        while (!queue.isEmpty()) {
            int node = queue.poll();
            count++;
            for (int neighbor : graph.get(node)) {
                if (--inDegree[neighbor] == 0) queue.offer(neighbor);
            }
        }
        return count == numCourses;
    }
}`,
      complexity: 'Time: O(V + E), Space: O(V + E)',
      explanation: 'Use topological sort via Kahn\'s algorithm (BFS). Build an adjacency list and in-degree array, process nodes with zero in-degree, and check if all nodes are visited.'
    },
    cpp: {
      code: `class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        vector<vector<int>> graph(numCourses);
        vector<int> inDegree(numCourses, 0);
        for (auto& pre : prerequisites) {
            graph[pre[1]].push_back(pre[0]);
            inDegree[pre[0]]++;
        }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) {
            if (inDegree[i] == 0) q.push(i);
        }
        int count = 0;
        while (!q.empty()) {
            int node = q.front();
            q.pop();
            count++;
            for (int neighbor : graph[node]) {
                if (--inDegree[neighbor] == 0) q.push(neighbor);
            }
        }
        return count == numCourses;
    }
};`,
      complexity: 'Time: O(V + E), Space: O(V + E)',
      explanation: 'Use topological sort via Kahn\'s algorithm (BFS). Build an adjacency list and in-degree array, process nodes with zero in-degree, and check if all nodes are visited.'
    },
    go: {
      code: `func canFinish(numCourses int, prerequisites [][]int) bool {
    graph := make([][]int, numCourses)
    inDegree := make([]int, numCourses)
    for i := range graph {
        graph[i] = []int{}
    }
    for _, pre := range prerequisites {
        graph[pre[1]] = append(graph[pre[1]], pre[0])
        inDegree[pre[0]]++
    }
    queue := []int{}
    for i := 0; i < numCourses; i++ {
        if inDegree[i] == 0 {
            queue = append(queue, i)
        }
    }
    count := 0
    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        count++
        for _, neighbor := range graph[node] {
            inDegree[neighbor]--
            if inDegree[neighbor] == 0 {
                queue = append(queue, neighbor)
            }
        }
    }
    return count == numCourses
}`,
      complexity: 'Time: O(V + E), Space: O(V + E)',
      explanation: 'Use topological sort via Kahn\'s algorithm (BFS). Build an adjacency list and in-degree array, process nodes with zero in-degree, and check if all nodes are visited.'
    },
    rust: {
      code: `use std::collections::VecDeque;

impl Solution {
    pub fn can_finish(num_courses: i32, prerequisites: Vec<Vec<i32>>) -> bool {
        let n = num_courses as usize;
        let mut graph = vec![vec![]; n];
        let mut in_degree = vec![0; n];
        for pre in &prerequisites {
            graph[pre[1] as usize].push(pre[0] as usize);
            in_degree[pre[0] as usize] += 1;
        }
        let mut queue: VecDeque<usize> = VecDeque::new();
        for i in 0..n {
            if in_degree[i] == 0 {
                queue.push_back(i);
            }
        }
        let mut count = 0;
        while let Some(node) = queue.pop_front() {
            count += 1;
            for &neighbor in &graph[node] {
                in_degree[neighbor] -= 1;
                if in_degree[neighbor] == 0 {
                    queue.push_back(neighbor);
                }
            }
        }
        count == n
    }
}`,
      complexity: 'Time: O(V + E), Space: O(V + E)',
      explanation: 'Use topological sort via Kahn\'s algorithm (BFS). Build an adjacency list and in-degree array, process nodes with zero in-degree, and check if all nodes are visited.'
    },
    typescript: {
      code: `function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const graph: number[][] = Array.from({ length: numCourses }, () => []);
  const inDegree: number[] = new Array(numCourses).fill(0);
  for (const [course, prereq] of prerequisites) {
    graph[prereq].push(course);
    inDegree[course]++;
  }
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  let count = 0;
  while (queue.length > 0) {
    const node = queue.shift()!;
    count++;
    for (const neighbor of graph[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }
  return count === numCourses;
}`,
      complexity: 'Time: O(V + E), Space: O(V + E)',
      explanation: 'Use topological sort via Kahn\'s algorithm (BFS). Build an adjacency list and in-degree array, process nodes with zero in-degree, and check if all nodes are visited.'
    }
  },

  '3sum': {
    javascript: {
      code: `function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let left = i + 1;
    let right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return result;
}`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Sort the array, then for each element use two pointers from both ends of the remaining array to find pairs that sum to the negation of the current element, skipping duplicates.'
    },
    python: {
      code: `def threeSum(nums):
    nums.sort()
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total == 0:
                result.append([nums[i], nums[left], nums[right]])
                while left < right and nums[left] == nums[left + 1]:
                    left += 1
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1
                left += 1
                right -= 1
            elif total < 0:
                left += 1
            else:
                right -= 1
    return result`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Sort the array, then for each element use two pointers from both ends of the remaining array to find pairs that sum to the negation of the current element, skipping duplicates.'
    },
    java: {
      code: `class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                if (sum == 0) {
                    result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                } else if (sum < 0) {
                    left++;
                } else {
                    right--;
                }
            }
        }
        return result;
    }
}`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Sort the array, then for each element use two pointers from both ends of the remaining array to find pairs that sum to the negation of the current element, skipping duplicates.'
    },
    cpp: {
      code: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> result;
        for (int i = 0; i < (int)nums.size() - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int left = i + 1, right = nums.size() - 1;
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                if (sum == 0) {
                    result.push_back({nums[i], nums[left], nums[right]});
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                } else if (sum < 0) {
                    left++;
                } else {
                    right--;
                }
            }
        }
        return result;
    }
};`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Sort the array, then for each element use two pointers from both ends of the remaining array to find pairs that sum to the negation of the current element, skipping duplicates.'
    },
    go: {
      code: `func threeSum(nums []int) [][]int {
    sort.Ints(nums)
    result := [][]int{}
    for i := 0; i < len(nums)-2; i++ {
        if i > 0 && nums[i] == nums[i-1] {
            continue
        }
        left, right := i+1, len(nums)-1
        for left < right {
            sum := nums[i] + nums[left] + nums[right]
            if sum == 0 {
                result = append(result, []int{nums[i], nums[left], nums[right]})
                for left < right && nums[left] == nums[left+1] {
                    left++
                }
                for left < right && nums[right] == nums[right-1] {
                    right--
                }
                left++
                right--
            } else if sum < 0 {
                left++
            } else {
                right--
            }
        }
    }
    return result
}`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Sort the array, then for each element use two pointers from both ends of the remaining array to find pairs that sum to the negation of the current element, skipping duplicates.'
    },
    rust: {
      code: `impl Solution {
    pub fn three_sum(mut nums: Vec<i32>) -> Vec<Vec<i32>> {
        nums.sort();
        let mut result = vec![];
        let n = nums.len();
        for i in 0..n.saturating_sub(2) {
            if i > 0 && nums[i] == nums[i - 1] {
                continue;
            }
            let mut left = i + 1;
            let mut right = n - 1;
            while left < right {
                let sum = nums[i] + nums[left] + nums[right];
                if sum == 0 {
                    result.push(vec![nums[i], nums[left], nums[right]]);
                    while left < right && nums[left] == nums[left + 1] {
                        left += 1;
                    }
                    while left < right && nums[right] == nums[right - 1] {
                        right -= 1;
                    }
                    left += 1;
                    right -= 1;
                } else if sum < 0 {
                    left += 1;
                } else {
                    right -= 1;
                }
            }
        }
        result
    }
}`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Sort the array, then for each element use two pointers from both ends of the remaining array to find pairs that sum to the negation of the current element, skipping duplicates.'
    },
    typescript: {
      code: `function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const result: number[][] = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let left = i + 1;
    let right = nums.length - 1;
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return result;
}`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Sort the array, then for each element use two pointers from both ends of the remaining array to find pairs that sum to the negation of the current element, skipping duplicates.'
    }
  },

  'trapping-rain-water': {
    javascript: {
      code: `function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        water += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        water += rightMax - height[right];
      }
      right--;
    }
  }
  return water;
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use two pointers from both ends, tracking the maximum height from each side. Water at each position is determined by the minimum of the two maxes minus the current height.'
    },
    python: {
      code: `def trap(height):
    left, right = 0, len(height) - 1
    left_max, right_max = 0, 0
    water = 0
    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                water += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]
            right -= 1
    return water`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use two pointers from both ends, tracking the maximum height from each side. Water at each position is determined by the minimum of the two maxes minus the current height.'
    },
    java: {
      code: `class Solution {
    public int trap(int[] height) {
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) {
                    leftMax = height[left];
                } else {
                    water += leftMax - height[left];
                }
                left++;
            } else {
                if (height[right] >= rightMax) {
                    rightMax = height[right];
                } else {
                    water += rightMax - height[right];
                }
                right--;
            }
        }
        return water;
    }
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use two pointers from both ends, tracking the maximum height from each side. Water at each position is determined by the minimum of the two maxes minus the current height.'
    },
    cpp: {
      code: `class Solution {
public:
    int trap(vector<int>& height) {
        int left = 0, right = height.size() - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) {
                    leftMax = height[left];
                } else {
                    water += leftMax - height[left];
                }
                left++;
            } else {
                if (height[right] >= rightMax) {
                    rightMax = height[right];
                } else {
                    water += rightMax - height[right];
                }
                right--;
            }
        }
        return water;
    }
};`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use two pointers from both ends, tracking the maximum height from each side. Water at each position is determined by the minimum of the two maxes minus the current height.'
    },
    go: {
      code: `func trap(height []int) int {
    left, right := 0, len(height)-1
    leftMax, rightMax := 0, 0
    water := 0
    for left < right {
        if height[left] < height[right] {
            if height[left] >= leftMax {
                leftMax = height[left]
            } else {
                water += leftMax - height[left]
            }
            left++
        } else {
            if height[right] >= rightMax {
                rightMax = height[right]
            } else {
                water += rightMax - height[right]
            }
            right--
        }
    }
    return water
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use two pointers from both ends, tracking the maximum height from each side. Water at each position is determined by the minimum of the two maxes minus the current height.'
    },
    rust: {
      code: `impl Solution {
    pub fn trap(height: Vec<i32>) -> i32 {
        let mut left = 0usize;
        let mut right = height.len() - 1;
        let mut left_max = 0;
        let mut right_max = 0;
        let mut water = 0;
        while left < right {
            if height[left] < height[right] {
                if height[left] >= left_max {
                    left_max = height[left];
                } else {
                    water += left_max - height[left];
                }
                left += 1;
            } else {
                if height[right] >= right_max {
                    right_max = height[right];
                } else {
                    water += right_max - height[right];
                }
                right -= 1;
            }
        }
        water
    }
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use two pointers from both ends, tracking the maximum height from each side. Water at each position is determined by the minimum of the two maxes minus the current height.'
    },
    typescript: {
      code: `function trap(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        water += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        water += rightMax - height[right];
      }
      right--;
    }
  }
  return water;
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use two pointers from both ends, tracking the maximum height from each side. Water at each position is determined by the minimum of the two maxes minus the current height.'
    }
  },

  'pacific-atlantic-water-flow': {
    javascript: {
      code: `function pacificAtlantic(heights) {
  if (!heights || heights.length === 0) return [];
  const rows = heights.length;
  const cols = heights[0].length;
  const pacific = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const atlantic = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function dfs(r, c, reachable, prevHeight) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (reachable[r][c] || heights[r][c] < prevHeight) return;
    reachable[r][c] = true;
    for (const [dr, dc] of dirs) {
      dfs(r + dr, c + dc, reachable, heights[r][c]);
    }
  }

  for (let r = 0; r < rows; r++) {
    dfs(r, 0, pacific, heights[r][0]);
    dfs(r, cols - 1, atlantic, heights[r][cols - 1]);
  }
  for (let c = 0; c < cols; c++) {
    dfs(0, c, pacific, heights[0][c]);
    dfs(rows - 1, c, atlantic, heights[rows - 1][c]);
  }

  const result = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pacific[r][c] && atlantic[r][c]) {
        result.push([r, c]);
      }
    }
  }
  return result;
}`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Run DFS from ocean borders inward, marking cells reachable by each ocean. A cell that can reach both oceans is one marked reachable by both the Pacific and Atlantic DFS passes.'
    },
    python: {
      code: `def pacificAtlantic(heights):
    if not heights:
        return []
    rows, cols = len(heights), len(heights[0])
    pacific = set()
    atlantic = set()

    def dfs(r, c, reachable, prev_height):
        if (r < 0 or r >= rows or c < 0 or c >= cols or
                (r, c) in reachable or heights[r][c] < prev_height):
            return
        reachable.add((r, c))
        for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            dfs(r + dr, c + dc, reachable, heights[r][c])

    for r in range(rows):
        dfs(r, 0, pacific, heights[r][0])
        dfs(r, cols - 1, atlantic, heights[r][cols - 1])
    for c in range(cols):
        dfs(0, c, pacific, heights[0][c])
        dfs(rows - 1, c, atlantic, heights[rows - 1][c])

    return list(pacific & atlantic)`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Run DFS from ocean borders inward, marking cells reachable by each ocean. Return cells that appear in both the Pacific and Atlantic reachable sets.'
    },
    java: {
      code: `class Solution {
    private int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        int rows = heights.length, cols = heights[0].length;
        boolean[][] pacific = new boolean[rows][cols];
        boolean[][] atlantic = new boolean[rows][cols];

        for (int r = 0; r < rows; r++) {
            dfs(heights, pacific, r, 0, rows, cols);
            dfs(heights, atlantic, r, cols - 1, rows, cols);
        }
        for (int c = 0; c < cols; c++) {
            dfs(heights, pacific, 0, c, rows, cols);
            dfs(heights, atlantic, rows - 1, c, rows, cols);
        }

        List<List<Integer>> result = new ArrayList<>();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (pacific[r][c] && atlantic[r][c]) {
                    result.add(Arrays.asList(r, c));
                }
            }
        }
        return result;
    }

    private void dfs(int[][] heights, boolean[][] reachable, int r, int c, int rows, int cols) {
        if (reachable[r][c]) return;
        reachable[r][c] = true;
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !reachable[nr][nc] && heights[nr][nc] >= heights[r][c]) {
                dfs(heights, reachable, nr, nc, rows, cols);
            }
        }
    }
}`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Run DFS from ocean borders inward, marking cells reachable by each ocean. A cell that can reach both oceans is one marked reachable by both the Pacific and Atlantic DFS passes.'
    },
    cpp: {
      code: `class Solution {
public:
    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {
        int rows = heights.size(), cols = heights[0].size();
        vector<vector<bool>> pacific(rows, vector<bool>(cols, false));
        vector<vector<bool>> atlantic(rows, vector<bool>(cols, false));

        for (int r = 0; r < rows; r++) {
            dfs(heights, pacific, r, 0, rows, cols);
            dfs(heights, atlantic, r, cols - 1, rows, cols);
        }
        for (int c = 0; c < cols; c++) {
            dfs(heights, pacific, 0, c, rows, cols);
            dfs(heights, atlantic, rows - 1, c, rows, cols);
        }

        vector<vector<int>> result;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (pacific[r][c] && atlantic[r][c]) {
                    result.push_back({r, c});
                }
            }
        }
        return result;
    }

    void dfs(vector<vector<int>>& heights, vector<vector<bool>>& reachable, int r, int c, int rows, int cols) {
        if (reachable[r][c]) return;
        reachable[r][c] = true;
        int dirs[4][2] = {{1,0},{-1,0},{0,1},{0,-1}};
        for (auto& d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !reachable[nr][nc] && heights[nr][nc] >= heights[r][c]) {
                dfs(heights, reachable, nr, nc, rows, cols);
            }
        }
    }
};`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Run DFS from ocean borders inward, marking cells reachable by each ocean. A cell that can reach both oceans is one marked reachable by both the Pacific and Atlantic DFS passes.'
    },
    go: {
      code: `func pacificAtlantic(heights [][]int) [][]int {
    rows, cols := len(heights), len(heights[0])
    pacific := make([][]bool, rows)
    atlantic := make([][]bool, rows)
    for i := range pacific {
        pacific[i] = make([]bool, cols)
        atlantic[i] = make([]bool, cols)
    }
    dirs := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

    var dfs func(reachable [][]bool, r, c int)
    dfs = func(reachable [][]bool, r, c int) {
        if reachable[r][c] {
            return
        }
        reachable[r][c] = true
        for _, d := range dirs {
            nr, nc := r+d[0], c+d[1]
            if nr >= 0 && nr < rows && nc >= 0 && nc < cols && !reachable[nr][nc] && heights[nr][nc] >= heights[r][c] {
                dfs(reachable, nr, nc)
            }
        }
    }

    for r := 0; r < rows; r++ {
        dfs(pacific, r, 0)
        dfs(atlantic, r, cols-1)
    }
    for c := 0; c < cols; c++ {
        dfs(pacific, 0, c)
        dfs(atlantic, rows-1, c)
    }

    result := [][]int{}
    for r := 0; r < rows; r++ {
        for c := 0; c < cols; c++ {
            if pacific[r][c] && atlantic[r][c] {
                result = append(result, []int{r, c})
            }
        }
    }
    return result
}`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Run DFS from ocean borders inward, marking cells reachable by each ocean. A cell that can reach both oceans is one marked reachable by both the Pacific and Atlantic DFS passes.'
    },
    rust: {
      code: `impl Solution {
    pub fn pacific_atlantic(heights: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
        let rows = heights.len();
        let cols = heights[0].len();
        let mut pacific = vec![vec![false; cols]; rows];
        let mut atlantic = vec![vec![false; cols]; rows];
        let dirs: [(i32, i32); 4] = [(1, 0), (-1, 0), (0, 1), (0, -1)];

        fn dfs(heights: &Vec<Vec<i32>>, reachable: &mut Vec<Vec<bool>>, r: usize, c: usize, rows: usize, cols: usize, dirs: &[(i32, i32); 4]) {
            if reachable[r][c] { return; }
            reachable[r][c] = true;
            for &(dr, dc) in dirs {
                let nr = r as i32 + dr;
                let nc = c as i32 + dc;
                if nr >= 0 && nr < rows as i32 && nc >= 0 && nc < cols as i32 {
                    let nr = nr as usize;
                    let nc = nc as usize;
                    if !reachable[nr][nc] && heights[nr][nc] >= heights[r][c] {
                        dfs(heights, reachable, nr, nc, rows, cols, dirs);
                    }
                }
            }
        }

        for r in 0..rows {
            dfs(&heights, &mut pacific, r, 0, rows, cols, &dirs);
            dfs(&heights, &mut atlantic, r, cols - 1, rows, cols, &dirs);
        }
        for c in 0..cols {
            dfs(&heights, &mut pacific, 0, c, rows, cols, &dirs);
            dfs(&heights, &mut atlantic, rows - 1, c, rows, cols, &dirs);
        }

        let mut result = vec![];
        for r in 0..rows {
            for c in 0..cols {
                if pacific[r][c] && atlantic[r][c] {
                    result.push(vec![r as i32, c as i32]);
                }
            }
        }
        result
    }
}`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Run DFS from ocean borders inward, marking cells reachable by each ocean. A cell that can reach both oceans is one marked reachable by both the Pacific and Atlantic DFS passes.'
    },
    typescript: {
      code: `function pacificAtlantic(heights: number[][]): number[][] {
  const rows = heights.length;
  const cols = heights[0].length;
  const pacific: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const atlantic: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function dfs(r: number, c: number, reachable: boolean[][], prevHeight: number): void {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (reachable[r][c] || heights[r][c] < prevHeight) return;
    reachable[r][c] = true;
    for (const [dr, dc] of dirs) {
      dfs(r + dr, c + dc, reachable, heights[r][c]);
    }
  }

  for (let r = 0; r < rows; r++) {
    dfs(r, 0, pacific, heights[r][0]);
    dfs(r, cols - 1, atlantic, heights[r][cols - 1]);
  }
  for (let c = 0; c < cols; c++) {
    dfs(0, c, pacific, heights[0][c]);
    dfs(rows - 1, c, atlantic, heights[rows - 1][c]);
  }

  const result: number[][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pacific[r][c] && atlantic[r][c]) {
        result.push([r, c]);
      }
    }
  }
  return result;
}`,
      complexity: 'Time: O(m * n), Space: O(m * n)',
      explanation: 'Run DFS from ocean borders inward, marking cells reachable by each ocean. A cell that can reach both oceans is one marked reachable by both the Pacific and Atlantic DFS passes.'
    }
  },

  'decode-ways': {
    javascript: {
      code: `function numDecodings(s) {
  if (s[0] === '0') return 0;
  const n = s.length;
  let prev2 = 1;
  let prev1 = 1;
  for (let i = 1; i < n; i++) {
    let current = 0;
    if (s[i] !== '0') {
      current = prev1;
    }
    const twoDigit = parseInt(s.substring(i - 1, i + 1));
    if (twoDigit >= 10 && twoDigit <= 26) {
      current += prev2;
    }
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming similar to Fibonacci. At each position, count ways by considering single-digit and two-digit decodings, using two variables to track previous states.'
    },
    python: {
      code: `def numDecodings(s):
    if s[0] == '0':
        return 0
    prev2, prev1 = 1, 1
    for i in range(1, len(s)):
        current = 0
        if s[i] != '0':
            current = prev1
        two_digit = int(s[i-1:i+1])
        if 10 <= two_digit <= 26:
            current += prev2
        prev2, prev1 = prev1, current
    return prev1`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming similar to Fibonacci. At each position, count ways by considering single-digit and two-digit decodings, using two variables to track previous states.'
    },
    java: {
      code: `class Solution {
    public int numDecodings(String s) {
        if (s.charAt(0) == '0') return 0;
        int prev2 = 1, prev1 = 1;
        for (int i = 1; i < s.length(); i++) {
            int current = 0;
            if (s.charAt(i) != '0') {
                current = prev1;
            }
            int twoDigit = Integer.parseInt(s.substring(i - 1, i + 1));
            if (twoDigit >= 10 && twoDigit <= 26) {
                current += prev2;
            }
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    }
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming similar to Fibonacci. At each position, count ways by considering single-digit and two-digit decodings, using two variables to track previous states.'
    },
    cpp: {
      code: `class Solution {
public:
    int numDecodings(string s) {
        if (s[0] == '0') return 0;
        int prev2 = 1, prev1 = 1;
        for (int i = 1; i < s.size(); i++) {
            int current = 0;
            if (s[i] != '0') {
                current = prev1;
            }
            int twoDigit = stoi(s.substr(i - 1, 2));
            if (twoDigit >= 10 && twoDigit <= 26) {
                current += prev2;
            }
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    }
};`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming similar to Fibonacci. At each position, count ways by considering single-digit and two-digit decodings, using two variables to track previous states.'
    },
    go: {
      code: `func numDecodings(s string) int {
    if s[0] == '0' {
        return 0
    }
    prev2, prev1 := 1, 1
    for i := 1; i < len(s); i++ {
        current := 0
        if s[i] != '0' {
            current = prev1
        }
        twoDigit := (int(s[i-1]-'0') * 10) + int(s[i]-'0')
        if twoDigit >= 10 && twoDigit <= 26 {
            current += prev2
        }
        prev2 = prev1
        prev1 = current
    }
    return prev1
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming similar to Fibonacci. At each position, count ways by considering single-digit and two-digit decodings, using two variables to track previous states.'
    },
    rust: {
      code: `impl Solution {
    pub fn num_decodings(s: String) -> i32 {
        let bytes = s.as_bytes();
        if bytes[0] == b'0' {
            return 0;
        }
        let mut prev2 = 1;
        let mut prev1 = 1;
        for i in 1..bytes.len() {
            let mut current = 0;
            if bytes[i] != b'0' {
                current = prev1;
            }
            let two_digit = (bytes[i - 1] - b'0') as i32 * 10 + (bytes[i] - b'0') as i32;
            if two_digit >= 10 && two_digit <= 26 {
                current += prev2;
            }
            prev2 = prev1;
            prev1 = current;
        }
        prev1
    }
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming similar to Fibonacci. At each position, count ways by considering single-digit and two-digit decodings, using two variables to track previous states.'
    },
    typescript: {
      code: `function numDecodings(s: string): number {
  if (s[0] === '0') return 0;
  let prev2 = 1;
  let prev1 = 1;
  for (let i = 1; i < s.length; i++) {
    let current = 0;
    if (s[i] !== '0') {
      current = prev1;
    }
    const twoDigit = parseInt(s.substring(i - 1, i + 1));
    if (twoDigit >= 10 && twoDigit <= 26) {
      current += prev2;
    }
    prev2 = prev1;
    prev1 = current;
  }
  return prev1;
}`,
      complexity: 'Time: O(n), Space: O(1)',
      explanation: 'Use dynamic programming similar to Fibonacci. At each position, count ways by considering single-digit and two-digit decodings, using two variables to track previous states.'
    }
  },

  'rotate-image': {
    javascript: {
      code: `function rotate(matrix) {
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }
  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }
}`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Rotate 90 degrees clockwise in-place by first transposing the matrix (swap rows and columns), then reversing each row.'
    },
    python: {
      code: `def rotate(matrix):
    n = len(matrix)
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    for row in matrix:
        row.reverse()`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Rotate 90 degrees clockwise in-place by first transposing the matrix (swap rows and columns), then reversing each row.'
    },
    java: {
      code: `class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int temp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = temp;
            }
        }
        for (int i = 0; i < n; i++) {
            for (int left = 0, right = n - 1; left < right; left++, right--) {
                int temp = matrix[i][left];
                matrix[i][left] = matrix[i][right];
                matrix[i][right] = temp;
            }
        }
    }
}`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Rotate 90 degrees clockwise in-place by first transposing the matrix (swap rows and columns), then reversing each row.'
    },
    cpp: {
      code: `class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n = matrix.size();
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                swap(matrix[i][j], matrix[j][i]);
            }
        }
        for (int i = 0; i < n; i++) {
            reverse(matrix[i].begin(), matrix[i].end());
        }
    }
};`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Rotate 90 degrees clockwise in-place by first transposing the matrix (swap rows and columns), then reversing each row.'
    },
    go: {
      code: `func rotate(matrix [][]int) {
    n := len(matrix)
    for i := 0; i < n; i++ {
        for j := i + 1; j < n; j++ {
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        }
    }
    for i := 0; i < n; i++ {
        for left, right := 0, n-1; left < right; left, right = left+1, right-1 {
            matrix[i][left], matrix[i][right] = matrix[i][right], matrix[i][left]
        }
    }
}`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Rotate 90 degrees clockwise in-place by first transposing the matrix (swap rows and columns), then reversing each row.'
    },
    rust: {
      code: `impl Solution {
    pub fn rotate(matrix: &mut Vec<Vec<i32>>) {
        let n = matrix.len();
        for i in 0..n {
            for j in (i + 1)..n {
                let temp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = temp;
            }
        }
        for row in matrix.iter_mut() {
            row.reverse();
        }
    }
}`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Rotate 90 degrees clockwise in-place by first transposing the matrix (swap rows and columns), then reversing each row.'
    },
    typescript: {
      code: `function rotate(matrix: number[][]): void {
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }
  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }
}`,
      complexity: 'Time: O(n^2), Space: O(1)',
      explanation: 'Rotate 90 degrees clockwise in-place by first transposing the matrix (swap rows and columns), then reversing each row.'
    }
  },

  'word-ladder': {
    javascript: {
      code: `function ladderLength(beginWord, endWord, wordList) {
  const wordSet = new Set(wordList);
  if (!wordSet.has(endWord)) return 0;
  const queue = [[beginWord, 1]];
  const visited = new Set([beginWord]);
  while (queue.length > 0) {
    const [word, length] = queue.shift();
    for (let i = 0; i < word.length; i++) {
      for (let c = 97; c <= 122; c++) {
        const newWord = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);
        if (newWord === endWord) return length + 1;
        if (wordSet.has(newWord) && !visited.has(newWord)) {
          visited.add(newWord);
          queue.push([newWord, length + 1]);
        }
      }
    }
  }
  return 0;
}`,
      complexity: 'Time: O(M^2 * N), Space: O(M * N)',
      explanation: 'Use BFS where each word is a node and edges connect words differing by one character. Try all 26 letter substitutions at each position to find neighbors in the word set.'
    },
    python: {
      code: `def ladderLength(beginWord, endWord, wordList):
    word_set = set(wordList)
    if endWord not in word_set:
        return 0
    queue = deque([(beginWord, 1)])
    visited = {beginWord}
    while queue:
        word, length = queue.popleft()
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                new_word = word[:i] + c + word[i+1:]
                if new_word == endWord:
                    return length + 1
                if new_word in word_set and new_word not in visited:
                    visited.add(new_word)
                    queue.append((new_word, length + 1))
    return 0`,
      complexity: 'Time: O(M^2 * N), Space: O(M * N)',
      explanation: 'Use BFS where each word is a node and edges connect words differing by one character. Try all 26 letter substitutions at each position to find neighbors in the word set.'
    },
    java: {
      code: `class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        Set<String> wordSet = new HashSet<>(wordList);
        if (!wordSet.contains(endWord)) return 0;
        Queue<String> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();
        queue.offer(beginWord);
        visited.add(beginWord);
        int length = 1;
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int s = 0; s < size; s++) {
                char[] word = queue.poll().toCharArray();
                for (int i = 0; i < word.length; i++) {
                    char original = word[i];
                    for (char c = 'a'; c <= 'z'; c++) {
                        word[i] = c;
                        String newWord = new String(word);
                        if (newWord.equals(endWord)) return length + 1;
                        if (wordSet.contains(newWord) && !visited.contains(newWord)) {
                            visited.add(newWord);
                            queue.offer(newWord);
                        }
                    }
                    word[i] = original;
                }
            }
            length++;
        }
        return 0;
    }
}`,
      complexity: 'Time: O(M^2 * N), Space: O(M * N)',
      explanation: 'Use BFS where each word is a node and edges connect words differing by one character. Try all 26 letter substitutions at each position to find neighbors in the word set.'
    },
    cpp: {
      code: `class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> wordSet(wordList.begin(), wordList.end());
        if (!wordSet.count(endWord)) return 0;
        queue<string> q;
        unordered_set<string> visited;
        q.push(beginWord);
        visited.insert(beginWord);
        int length = 1;
        while (!q.empty()) {
            int size = q.size();
            for (int s = 0; s < size; s++) {
                string word = q.front();
                q.pop();
                for (int i = 0; i < word.size(); i++) {
                    char original = word[i];
                    for (char c = 'a'; c <= 'z'; c++) {
                        word[i] = c;
                        if (word == endWord) return length + 1;
                        if (wordSet.count(word) && !visited.count(word)) {
                            visited.insert(word);
                            q.push(word);
                        }
                    }
                    word[i] = original;
                }
            }
            length++;
        }
        return 0;
    }
};`,
      complexity: 'Time: O(M^2 * N), Space: O(M * N)',
      explanation: 'Use BFS where each word is a node and edges connect words differing by one character. Try all 26 letter substitutions at each position to find neighbors in the word set.'
    },
    go: {
      code: `func ladderLength(beginWord string, endWord string, wordList []string) int {
    wordSet := make(map[string]bool)
    for _, w := range wordList {
        wordSet[w] = true
    }
    if !wordSet[endWord] {
        return 0
    }
    visited := map[string]bool{beginWord: true}
    queue := []string{beginWord}
    length := 1
    for len(queue) > 0 {
        size := len(queue)
        for s := 0; s < size; s++ {
            word := []byte(queue[0])
            queue = queue[1:]
            for i := 0; i < len(word); i++ {
                original := word[i]
                for c := byte('a'); c <= byte('z'); c++ {
                    word[i] = c
                    newWord := string(word)
                    if newWord == endWord {
                        return length + 1
                    }
                    if wordSet[newWord] && !visited[newWord] {
                        visited[newWord] = true
                        queue = append(queue, newWord)
                    }
                }
                word[i] = original
            }
        }
        length++
    }
    return 0
}`,
      complexity: 'Time: O(M^2 * N), Space: O(M * N)',
      explanation: 'Use BFS where each word is a node and edges connect words differing by one character. Try all 26 letter substitutions at each position to find neighbors in the word set.'
    },
    rust: {
      code: `use std::collections::{HashSet, VecDeque};

impl Solution {
    pub fn ladder_length(begin_word: String, end_word: String, word_list: Vec<String>) -> i32 {
        let word_set: HashSet<String> = word_list.into_iter().collect();
        if !word_set.contains(&end_word) {
            return 0;
        }
        let mut visited = HashSet::new();
        visited.insert(begin_word.clone());
        let mut queue = VecDeque::new();
        queue.push_back(begin_word);
        let mut length = 1;
        while !queue.is_empty() {
            let size = queue.len();
            for _ in 0..size {
                let word = queue.pop_front().unwrap();
                let mut chars: Vec<u8> = word.bytes().collect();
                for i in 0..chars.len() {
                    let original = chars[i];
                    for c in b'a'..=b'z' {
                        chars[i] = c;
                        let new_word = String::from_utf8(chars.clone()).unwrap();
                        if new_word == end_word {
                            return length + 1;
                        }
                        if word_set.contains(&new_word) && !visited.contains(&new_word) {
                            visited.insert(new_word.clone());
                            queue.push_back(new_word);
                        }
                    }
                    chars[i] = original;
                }
            }
            length += 1;
        }
        0
    }
}`,
      complexity: 'Time: O(M^2 * N), Space: O(M * N)',
      explanation: 'Use BFS where each word is a node and edges connect words differing by one character. Try all 26 letter substitutions at each position to find neighbors in the word set.'
    },
    typescript: {
      code: `function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  const wordSet = new Set(wordList);
  if (!wordSet.has(endWord)) return 0;
  const queue: [string, number][] = [[beginWord, 1]];
  const visited = new Set<string>([beginWord]);
  while (queue.length > 0) {
    const [word, length] = queue.shift()!;
    for (let i = 0; i < word.length; i++) {
      for (let c = 97; c <= 122; c++) {
        const newWord = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);
        if (newWord === endWord) return length + 1;
        if (wordSet.has(newWord) && !visited.has(newWord)) {
          visited.add(newWord);
          queue.push([newWord, length + 1]);
        }
      }
    }
  }
  return 0;
}`,
      complexity: 'Time: O(M^2 * N), Space: O(M * N)',
      explanation: 'Use BFS where each word is a node and edges connect words differing by one character. Try all 26 letter substitutions at each position to find neighbors in the word set.'
    }
  },

  'serialize-and-deserialize-binary-tree': {
    javascript: {
      code: `class Codec {
  serialize(root) {
    if (!root) return 'null';
    return root.val + ',' + this.serialize(root.left) + ',' + this.serialize(root.right);
  }

  deserialize(data) {
    const values = data.split(',');
    let index = 0;

    function build() {
      if (index >= values.length || values[index] === 'null') {
        index++;
        return null;
      }
      const node = new TreeNode(parseInt(values[index]));
      index++;
      node.left = build();
      node.right = build();
      return node;
    }

    return build();
  }
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use preorder traversal for serialization, encoding null nodes as "null". Deserialize by recursively consuming tokens from the serialized string in the same preorder sequence.'
    },
    python: {
      code: `class Codec:
    def serialize(self, root):
        if not root:
            return 'null'
        return str(root.val) + ',' + self.serialize(root.left) + ',' + self.serialize(root.right)

    def deserialize(self, data):
        values = iter(data.split(','))

        def build():
            val = next(values)
            if val == 'null':
                return None
            node = TreeNode(int(val))
            node.left = build()
            node.right = build()
            return node

        return build()`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use preorder traversal for serialization, encoding null nodes as "null". Deserialize by recursively consuming tokens from an iterator in the same preorder sequence.'
    },
    java: {
      code: `public class Codec {
    public String serialize(TreeNode root) {
        if (root == null) return "null";
        return root.val + "," + serialize(root.left) + "," + serialize(root.right);
    }

    public TreeNode deserialize(String data) {
        Queue<String> queue = new LinkedList<>(Arrays.asList(data.split(",")));
        return build(queue);
    }

    private TreeNode build(Queue<String> queue) {
        String val = queue.poll();
        if (val.equals("null")) return null;
        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left = build(queue);
        node.right = build(queue);
        return node;
    }
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use preorder traversal for serialization, encoding null nodes as "null". Deserialize by consuming tokens from a queue in the same preorder sequence.'
    },
    cpp: {
      code: `class Codec {
public:
    string serialize(TreeNode* root) {
        if (!root) return "null";
        return to_string(root->val) + "," + serialize(root->left) + "," + serialize(root->right);
    }

    TreeNode* deserialize(string data) {
        istringstream ss(data);
        return build(ss);
    }

    TreeNode* build(istringstream& ss) {
        string val;
        getline(ss, val, ',');
        if (val == "null") return nullptr;
        TreeNode* node = new TreeNode(stoi(val));
        node->left = build(ss);
        node->right = build(ss);
        return node;
    }
};`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use preorder traversal for serialization, encoding null nodes as "null". Deserialize by reading tokens from an istringstream in the same preorder sequence.'
    },
    go: {
      code: `type Codec struct{}

func Constructor() Codec {
    return Codec{}
}

func (c *Codec) serialize(root *TreeNode) string {
    if root == nil {
        return "null"
    }
    return strconv.Itoa(root.Val) + "," + c.serialize(root.Left) + "," + c.serialize(root.Right)
}

func (c *Codec) deserialize(data string) *TreeNode {
    values := strings.Split(data, ",")
    index := 0
    var build func() *TreeNode
    build = func() *TreeNode {
        if index >= len(values) || values[index] == "null" {
            index++
            return nil
        }
        val, _ := strconv.Atoi(values[index])
        index++
        node := &TreeNode{Val: val}
        node.Left = build()
        node.Right = build()
        return node
    }
    return build()
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use preorder traversal for serialization, encoding nil nodes as "null". Deserialize by recursively consuming tokens from the split string in the same preorder sequence.'
    },
    rust: {
      code: `use std::rc::Rc;
use std::cell::RefCell;

struct Codec;

impl Codec {
    fn new() -> Self {
        Codec
    }

    fn serialize(&self, root: Option<Rc<RefCell<TreeNode>>>) -> String {
        match root {
            None => "null".to_string(),
            Some(node) => {
                let node = node.borrow();
                format!("{},{},{}", node.val, self.serialize(node.left.clone()), self.serialize(node.right.clone()))
            }
        }
    }

    fn deserialize(&self, data: String) -> Option<Rc<RefCell<TreeNode>>> {
        let values: Vec<&str> = data.split(',').collect();
        let mut index = 0;
        Self::build(&values, &mut index)
    }

    fn build(values: &[&str], index: &mut usize) -> Option<Rc<RefCell<TreeNode>>> {
        if *index >= values.len() || values[*index] == "null" {
            *index += 1;
            return None;
        }
        let val: i32 = values[*index].parse().unwrap();
        *index += 1;
        let node = Rc::new(RefCell::new(TreeNode::new(val)));
        node.borrow_mut().left = Self::build(values, index);
        node.borrow_mut().right = Self::build(values, index);
        Some(node)
    }
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use preorder traversal for serialization, encoding None nodes as "null". Deserialize by recursively consuming tokens from the split string in the same preorder sequence.'
    },
    typescript: {
      code: `class Codec {
  serialize(root: TreeNode | null): string {
    if (!root) return 'null';
    return root.val + ',' + this.serialize(root.left) + ',' + this.serialize(root.right);
  }

  deserialize(data: string): TreeNode | null {
    const values = data.split(',');
    let index = 0;

    function build(): TreeNode | null {
      if (index >= values.length || values[index] === 'null') {
        index++;
        return null;
      }
      const node = new TreeNode(parseInt(values[index]));
      index++;
      node.left = build();
      node.right = build();
      return node;
    }

    return build();
  }
}`,
      complexity: 'Time: O(n), Space: O(n)',
      explanation: 'Use preorder traversal for serialization, encoding null nodes as "null". Deserialize by recursively consuming tokens from the serialized string in the same preorder sequence.'
    }
  }
};
