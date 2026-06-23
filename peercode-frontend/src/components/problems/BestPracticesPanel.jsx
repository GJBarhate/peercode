import { Lightbulb, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function BestPracticesPanel({ language = 'javascript' }) {
 const [expanded, setExpanded] = useState(false)

 const practices = {
 general: [
 '📖 Read the problem statement carefully twice',
 '🎯 Identify constraints and edge cases',
 '✏️ Work through examples manually before coding',
 '⏱️ Consider time complexity - aim for optimal solution',
 '💾 Consider space complexity - minimize extra memory',
 '✨ Write clean, readable code with good naming',
 '💬 Add comments for complex logic',
 '🧪 Test with provided examples first',
 '🔍 Check edge cases: empty, single element, duplicates',
 ],
 javascript: [
 '🎯 Use Array methods (map, filter, reduce) effectively',
 '⚡ Use Set/Map for O(1) lookups instead of nested loops',
 '⚠️ Watch out for floating point precision issues',
 '0️⃣ Remember array indices start at 0',
 '🔄 Use destructuring for cleaner code',
 '❌ Avoid modifying input array unless required',
 '📊 Use console.log for debugging',
 ],
 python: [
 '📝 Use list comprehensions for concise code',
 '🗂️ Use defaultdict or Counter for frequency counting',
 '⚡ Use built-in functions: sum(), min(), max(), sorted()',
 '🔄 Use enumerate() for index + value',
 '🎯 Use slicing efficiently: arr[start:end:step]',
 '❌ Remember negative indexing: arr[-1] is last element',
 '⚠️ Be careful with mutable default arguments',
 ],
 java: [
 '📦 Use ArrayList for dynamic arrays',
 '🗺️ Use HashMap/HashSet for O(1) lookups',
 '🔗 Use StringBuilder for string concatenation',
 '✅ Check for null pointers early',
 '📏 Use Java Stream API for functional operations',
 '⚡ Prefer primitive types when possible',
 '🎯 Use Enhanced for loop: for (int x : arr)',
 ],
 cpp: [
 '📦 Use vector instead of raw arrays',
 '🗺️ Use unordered_map for O(1) average lookups',
 '⚡ Pass vectors by reference to avoid copying',
 '⚠️ Be careful with integer overflow',
 '🔄 Use auto for type inference',
 '📊 Use algorithm library: sort(), binary_search()',
 '💾 Use reserve() to avoid reallocations',
 ],
 go: [
 '🎯 Use slices instead of arrays for flexibility',
 '🗺️ Use maps for key-value storage',
 '❌ Handle errors explicitly - don\'t ignore them',
 '🔄 Use range for iterating over slices/maps',
 '📦 Use structs for organizing related data',
 '⚡ Pass slices by reference when modifying',
 '💪 Use goroutines for concurrent operations',
 ]
 }

 const currentPractices = practices[language] || practices.javascript

 return (
 <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/20 border border-amber-700/40 rounded-2xl overflow-hidden">
 <button
 onClick={() => setExpanded(!expanded)}
 className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-900/20 transition-colors"
 >
 <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0" />
 <span className="text-sm font-semibold text-amber-200">Best Practices</span>
 <span className={`ml-auto text-xs text-amber-300 transition-transform ${expanded ? 'rotate-180' : ''}`}>
 ▼
 </span>
 </button>

 {expanded && (
 <div className="border-t border-amber-700/40 px-4 py-4 space-y-2 max-h-96 overflow-y-auto">
 {currentPractices.map((practice, i) => (
 <div key={i} className="flex items-start gap-2.5 text-xs text-amber-100">
 <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
 <span>{practice}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 )
}
