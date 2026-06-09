/**
 * Sample Problem Data with Test Cases and Starter Code
 * For seeding database with complete problem examples
 */

const sampleProblems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.

You may assume that each input has exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    difficulty: "easy",
    companies: ["Amazon", "Google", "Facebook"],
    examples: [
      {
        input: "[2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "[3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
      { input: "[3,3]\n6", expectedOutput: "[0,1]" },
      { input: "[2,5,5,11]\n10", expectedOutput: "[1,2]" }
    ],
    tags: ["Array", "Hash Table"],
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
    timeLimit: 2000,
    memoryLimit: 256,
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your solution here
    return [0, 1];
};`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Your solution here
        return [0, 1]`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your solution here
        return new int[]{0, 1};
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your solution here
        return {0, 1};
    }
};`,
      go: `func TwoSum(nums []int, target int) []int {
    // Your solution here
    return []int{0, 1}
}`
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
    }
  },
  {
    title: "Reverse String",
    slug: "reverse-string",
    description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    difficulty: "easy",
    companies: ["Microsoft", "Amazon"],
    examples: [
      {
        input: `["h","e","l","l","o"]`,
        output: `["o","l","l","e","h"]`,
        explanation: "The string 'hello' reversed is 'olleh'"
      },
      {
        input: `["H","a","n","n","a","h"]`,
        output: `["h","a","n","n","a","H"]`,
        explanation: "The string 'Hannah' reversed is 'hannaH'"
      }
    ],
    testCases: [
      { input: `h,e,l,l,o`, expectedOutput: `o,l,l,e,h` },
      { input: `H,a,n,n,a,h`, expectedOutput: `h,a,n,n,a,H` },
      { input: `a`, expectedOutput: `a` },
      { input: `a,b`, expectedOutput: `b,a` }
    ],
    tags: ["String", "Two Pointers"],
    constraints: "1 <= s.length <= 10^5\ns[i] is a printable ascii character.",
    starterCode: {
      javascript: `/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
var reverseString = function(s) {
    // Your solution here
};`,
      python: `class Solution:
    def reverseString(self, s: list[str]) -> None:
        # Your solution here - modify s in-place
        pass`,
      java: `class Solution {
    public void reverseString(char[] s) {
        // Your solution here - modify s in-place
    }
}`,
      cpp: `class Solution {
public:
    void reverseString(vector<char>& s) {
        // Your solution here - modify s in-place
    }
};`,
      go: `func ReverseString(s []byte) {
    // Your solution here - modify s in-place
}`
    }
  },
  {
    title: "Add Two Numbers",
    slug: "add-two-numbers",
    description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit.

Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.`,
    difficulty: "medium",
    companies: ["Google", "Facebook", "Bloomberg"],
    examples: [
      {
        input: "l1 = [2,4,3], l2 = [5,6,4]",
        output: "[7,0,8]",
        explanation: "342 + 465 = 807"
      }
    ],
    testCases: [
      { input: "2,4,3\n5,6,4", expectedOutput: "7,0,8" },
      { input: "0\n0", expectedOutput: "0" },
      { input: "9,9,9,9,9,9,9\n9,9,9,9", expectedOutput: "8,9,9,9,0,0,0,1" }
    ],
    tags: ["Linked List", "Math"],
    constraints: "The number of nodes in each linked list is in the range [1, 100].\n0 <= Node.val <= 9",
    starterCode: {
      javascript: `/**
 * Definition for singly-linked list node
 * function ListNode(val, next = null) {
 *     this.val = val;
 *     this.next = next;
 * }
 */
var addTwoNumbers = function(l1, l2) {
    // Your solution here
    return null;
};`,
      python: `# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class Solution:
    def addTwoNumbers(self, l1: ListNode, l2: ListNode) -> ListNode:
        # Your solution here
        return None`,
      java: `/**
 * Definition for singly-linked list.
 */
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        // Your solution here
        return null;
    }
}`,
      cpp: `/**
 * Definition for singly-linked list.
 */
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        // Your solution here
        return nullptr;
    }
};`,
      go: `/**
 * Definition for singly-linked list.
 */
type ListNode struct {
    Val  int
    Next *ListNode
}

func AddTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
    // Your solution here
    return nil
}`
    }
  }
]

module.exports = { sampleProblems }
