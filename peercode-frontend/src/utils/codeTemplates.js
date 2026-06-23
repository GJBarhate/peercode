export const STARTER_CODE = {
 javascript: `function solution(nums) {
 // Your solution here
 return 0;
}

console.log(solution([1, 2, 3]));`,

 typescript: `function solution(nums: number[]): number {
 // Your solution here
 return 0;
}

console.log(solution([1, 2, 3]));`,

 python: `class Solution:
 def solve(self, nums: list[int]) -> int:
 # Your solution here
 return 0


if __name__ == "__main__":
 print(Solution().solve([1, 2, 3]))`,

 java: `import java.util.*;

class Solution {
 public int solve(int[] nums) {
 // Your solution here
 return 0;
 }

 public static void main(String[] args) {
 Solution solution = new Solution();
 System.out.println(solution.solve(new int[]{1, 2, 3}));
 }
}`,

 cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
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

 go: `package main

import "fmt"

func Solve(nums []int) int {
 // Your solution here
 return 0
}

func main() {
 fmt.Println(Solve([]int{1, 2, 3}))
}`,
}
