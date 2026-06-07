'use strict';

const templates = {
  javascript: {
    starter: `/**
 * @param {number[]} nums
 * @return {number}
 */
var solution = function(nums) {
    // Your solution here
    return 0;
};

// Test cases will be run with: solution([...])`,
    hints: {
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      approach: 'Think about the problem step by step'
    }
  },

  typescript: {
    starter: `function solution(nums: number[]): number {
    // Your solution here
    return 0;
}

console.log(solution([1, 2, 3]));`,
    hints: {
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      approach: 'Use explicit types and keep the implementation testable'
    }
  },

  python: {
    starter: `class Solution:
    def solve(self, nums: list[int]) -> int:
        """
        Args:
            nums: List of integers

        Returns:
            The result based on problem requirements

        Time Complexity: O(n)
        Space Complexity: O(1)
        """
        # Your solution here
        return 0


# Test: solution = Solution(); print(solution.solve([...]))`,
    hints: {
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      approach: 'Identify the pattern and constraints'
    }
  },

  java: {
    starter: `import java.util.*;

class Solution {
    /**
     * @param nums array of integers
     * @return the result based on problem requirements
     *
     * Time Complexity: O(n)
     * Space Complexity: O(1)
     */
    public int solve(int[] nums) {
        // Your solution here
        return 0;
    }

    public static void main(String[] args) {
        Solution solution = new Solution();
        System.out.println(solution.solve(new int[]{1, 2, 3}));
    }
}`,
    hints: {
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      approach: 'Consider edge cases and optimize'
    }
  },

  cpp: {
    starter: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    /**
     * @param nums vector of integers
     * @return the result
     *
     * Time Complexity: O(n)
     * Space Complexity: O(1)
     */
    int solve(vector<int>& nums) {
        // Your solution here
        return 0;
    }
};

int main() {
    vector<int> nums = {1, 2, 3};
    Solution solution;
    cout << solution.solve(nums) << endl;
    return 0;
}`,
    hints: {
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      approach: 'Use STL containers efficiently'
    }
  },

  go: {
    starter: `package main

import "fmt"

// Solve solves the problem
// Time Complexity: O(n)
// Space Complexity: O(1)
func Solve(nums []int) int {
    // Your solution here
    return 0
}

func main() {
    fmt.Println(Solve([]int{1, 2, 3}))
}`,
    hints: {
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      approach: 'Write idiomatic Go code'
    }
  }
};

const bestPractices = {
  general: [
    'Read the problem statement carefully',
    'Identify constraints (array size, value ranges, etc.)',
    'Work through examples manually',
    'Consider edge cases (empty array, single element, etc.)',
    'Think about time and space complexity first',
    'Write clean, readable code',
    'Add comments for complex logic',
    'Test with provided examples',
    'Optimize if time/space complexity is suboptimal'
  ],
  javascript: [
    'Use Array methods (map, filter, reduce) when appropriate',
    'Consider using Set/Map for fast lookups',
    'Watch out for floating point precision',
    'Remember array indices start at 0'
  ],
  typescript: [
    'Keep function signatures explicit and avoid implicit any',
    'Use arrays, maps, and sets with concrete generic types',
    'Prefer small pure functions that are easy to test',
    'Narrow nullable values before using them'
  ],
  python: [
    'Use list comprehensions for concise code',
    'Consider defaultdict for counting',
    'Use built-in functions (sum, min, max, sorted)',
    'Remember 0-indexed arrays and negative indexing'
  ],
  java: [
    'Prefer ArrayList over raw arrays for flexibility',
    'Use HashMap/HashSet for O(1) lookups',
    'Remember strings are immutable - use StringBuilder for concatenation',
    'Check for null pointers early'
  ],
  cpp: [
    'Use unordered_map for O(1) average lookups',
    'Use vector for dynamic arrays',
    'Pass vectors by reference to avoid copying',
    'Be careful with integer overflow'
  ],
  go: [
    'Use slices instead of arrays for flexibility',
    'Use maps for key-value storage',
    'Prefer interfaces for abstraction',
    'Handle errors explicitly'
  ]
};

module.exports = { templates, bestPractices };
