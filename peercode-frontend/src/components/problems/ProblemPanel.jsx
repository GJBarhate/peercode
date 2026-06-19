import { useState, useEffect, useMemo } from 'react'
import { Flag, Code2, User, Clock, Eye, EyeOff, BookOpen, Lightbulb, MessageSquare, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Copy, Check } from 'lucide-react'
import Badge from '../common/Badge'
import Skeleton from '../common/Skeleton'
import { getProblem, getSolutions, createSolution, getErrorMessage } from '../../services/api'
import { useBookmarks } from '../../hooks/useBookmarks'
import SyntaxHighlight from './SyntaxHighlight'
import toast from 'react-hot-toast'

/* ───────────── copy code block ───────────── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }
  return (
    <button onClick={copy} className="p-1.5 rounded-md bg-gray-700/60 hover:bg-gray-600 text-gray-400 hover:text-gray-200 transition-all" title={copied ? 'Copied!' : 'Copy'}>
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

/* ───────────── lightweight markdown renderer ───────────── */
function MarkdownBlock({ text }) {
  if (!text?.trim()) return null

  const lines = text.split('\n')
  const elements = []
  let i = 0
  let keyCounter = 0
  const nextKey = () => `mk_${keyCounter++}`

  while (i < lines.length) {
    const line = lines[i]

    /* fenced code block */
    if (line.trimStart().startsWith('```')) {
      const lang = line.trim().slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
          <div key={nextKey()} className="my-3 rounded-xl overflow-hidden border border-gray-700/60">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700/60">
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              {lang && <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">{lang}</span>}
            </div>
            <CopyButton text={codeLines.join('\n')} />
          </div>
          <pre className="px-4 py-3 overflow-x-auto bg-gray-900/80 text-xs font-mono text-gray-200 leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      )
      i++
      continue
    }

    /* headings */
    if (/^### /.test(line)) {
      elements.push(<h4 key={nextKey()} className="text-sm font-bold text-gray-200 mt-4 mb-1.5">{inlineRender(line.slice(4))}</h4>)
      i++; continue
    }
    if (/^## /.test(line)) {
      elements.push(<h3 key={nextKey()} className="text-base font-bold text-gray-100 mt-5 mb-2 pb-2 border-b border-gray-800">{inlineRender(line.slice(3))}</h3>)
      i++; continue
    }
    if (/^# /.test(line)) {
      elements.push(<h2 key={nextKey()} className="text-lg font-bold text-gray-100 mt-5 mb-2">{inlineRender(line.slice(2))}</h2>)
      i++; continue
    }

    /* horizontal rule */
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={nextKey()} className="border-gray-800 my-4" />)
      i++; continue
    }

    /* blockquote */
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={nextKey()} className="border-l-2 border-indigo-500/50 pl-4 py-1 my-2 text-gray-400 italic text-sm">
          {inlineRender(line.slice(2))}
        </blockquote>
      )
      i++; continue
    }

    /* unordered list */
    if (/^[-*] /.test(line)) {
      const items = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={nextKey()} className="my-2 space-y-1.5 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400/60 flex-shrink-0" />
              <span>{inlineRender(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    /* ordered list */
    if (/^\d+\. /.test(line)) {
      const items = []
      let num = 1
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      elements.push(
        <ol key={nextKey()} className="my-2 space-y-1.5 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-sm text-gray-300">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{j + 1}</span>
              <span>{inlineRender(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    /* blank line */
    if (line.trim() === '') { elements.push(<div key={nextKey()} className="h-2" />); i++; continue }

    /* table */
    if (line.trimStart().startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].trimStart().startsWith('|')) {
        if (!lines[i].includes('---')) { // skip separator row
          rows.push(lines[i])
        }
        i++
      }
      if (rows.length > 0) {
        const headers = rows[0].split('|').filter(c => c.trim()).map(c => c.trim())
        const data = rows.slice(1).map(r => r.split('|').filter(c => c.trim()).map(c => c.trim()))
        elements.push(
          <div key={nextKey()} className="my-3 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  {headers.map((h, j) => (
                    <th key={j} className="px-3 py-2 text-left text-xs font-bold text-gray-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, j) => (
                  <tr key={j} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    {row.map((cell, k) => (
                      <td key={k} className="px-3 py-2 text-sm text-gray-300">{inlineRender(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    /* paragraph */
    elements.push(
      <p key={nextKey()} className="text-sm text-gray-300 leading-relaxed">
        {inlineRender(line)}
      </p>
    )
    i++
  }

  return <div className="space-y-1">{elements}</div>
}

function inlineRender(text) {
  /* split on bold, italic, inline-code */
  const parts = []
  let rest = text
  let key = 0
  const patterns = [
    { re: /\*\*(.+?)\*\*/,  render: m => <strong key={key++} className="font-bold text-gray-100">{m[1]}</strong> },
    { re: /\*(.+?)\*/,       render: m => <em key={key++} className="italic text-gray-300">{m[1]}</em> },
    { re: /`([^`]+)`/,       render: m => <code key={key++} className="px-1.5 py-0.5 bg-gray-800 border border-gray-700/60 rounded text-[11px] font-mono text-indigo-300">{m[1]}</code> },
  ]

  while (rest) {
    let earliest = null, earliestIdx = Infinity
    for (const p of patterns) {
      const m = rest.match(p.re)
      if (m && m.index < earliestIdx) { earliest = { ...p, match: m }; earliestIdx = m.index }
    }
    if (!earliest) { parts.push(rest); break }
    if (earliestIdx > 0) parts.push(rest.slice(0, earliestIdx))
    parts.push(earliest.render(earliest.match))
    rest = rest.slice(earliestIdx + earliest.match[0].length)
  }

  return parts
}

/* ───────────── Description renderer ───────────── */
function DescriptionBlock({ text }) {
  if (!text) return null
  /* check if it has markdown-like syntax */
  const hasMarkdown = /^#{1,3} |^[-*] |\*\*|```/.test(text)
  if (hasMarkdown) return <MarkdownBlock text={text} />
  /* plain text – preserve newlines */
  return <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{text}</p>
}

/* ───────────── Complexity badge ───────────── */
function ComplexityLine({ text }) {
  const timeMatch = text.match(/O\([^)]+\)/)
  if (!timeMatch) return null
  const times = text.match(/O\([^)]+\)/g) || []
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {times.map((t, i) => (
        <span key={i} className="px-2 py-0.5 bg-violet-500/15 text-violet-300 border border-violet-500/20 rounded font-mono text-[11px] font-bold">{t}</span>
      ))}
    </div>
  )
}

/* ───────────── Hint card with reveal ───────────── */
function HintCard({ hint, index, revealed, onReveal }) {
  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
      revealed ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-gray-800 bg-gray-900/50'
    }`}>
      <button
        onClick={() => !revealed && onReveal(index)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
          revealed ? 'cursor-default' : 'hover:bg-white/5 cursor-pointer'
        }`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          revealed ? 'bg-indigo-500/20' : 'bg-gray-800'
        }`}>
          {revealed
            ? <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
            : <EyeOff className="w-3.5 h-3.5 text-gray-600" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-bold ${revealed ? 'text-indigo-400' : 'text-gray-500'}`}>
            Hint {index + 1}
          </span>
          {!revealed && <p className="text-[11px] text-gray-700 mt-0.5">Click to reveal</p>}
        </div>
        {revealed && <Eye className="w-3.5 h-3.5 text-gray-600" />}
      </button>
      {revealed && (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-300 leading-relaxed">{hint}</p>
        </div>
      )}
    </div>
  )
}

/* ───────────── Editorial content with smart fallback ───────────── */
const EDITORIAL_LANGS = ['javascript', 'python', 'java', 'cpp', 'typescript', 'go']
const LANG_LABELS = { javascript: 'JavaScript', python: 'Python', java: 'Java', cpp: 'C++', typescript: 'TypeScript', go: 'Go' }

function buildFallbackEditorial(problem) {
  const tags = problem.tags || []
  const difficulty = problem.difficulty || 'medium'
  const title = problem.title || 'this problem'

  // Generate approach based on tags
  function getApproach() {
    if (tags.includes('hash-table') || tags.includes('hash-map'))
      return 'Use a **hash map** to store elements as we traverse them, enabling O(1) lookups for complements or duplicates.'
    if (tags.includes('two-pointers'))
      return 'Use **two pointers** moving toward each other from opposite ends (or both from the start) to scan the array in O(n).'
    if (tags.includes('sliding-window'))
      return 'Use a **sliding window** that expands and contracts as needed, maintaining a valid window and tracking the best result.'
    if (tags.includes('dynamic-programming'))
      return 'Use **dynamic programming** to break the problem into overlapping subproblems, solving each once and storing the result.'
    if (tags.includes('binary-search'))
      return 'Use **binary search** to find a boundary in a monotonic space, eliminating half the search space at each step.'
    if (tags.includes('graph') || tags.includes('bfs') || tags.includes('dfs'))
      return 'Model the problem as a **graph** and traverse with **BFS** (shortest path) or **DFS** (connectivity).'
    if (tags.includes('stack'))
      return 'Use a **stack** to process elements in LIFO order, resolving the most recent pending element when a match is found.'
    if (tags.includes('greedy'))
      return 'Use a **greedy** approach — make the locally optimal choice at each step.'
    if (tags.includes('backtracking'))
      return 'Use **backtracking** to explore all candidates recursively and undo choices that lead to dead ends.'
    return 'Choose the right data structure and iterate through the input efficiently.'
  }

  function getSteps() {
    const generic = [
      '**Analyze** the input format and constraints. Identify edge cases: empty input, single element, duplicates.',
      '**Choose** the appropriate data structure based on the operations needed (lookup, ordering, traversal).',
      '**Process** the input in a single pass or with the chosen strategy, updating state at each step.',
      '**Return** the result after processing. Verify with provided examples and edge cases.',
    ]
    if (tags.includes('hash-table') || tags.includes('hash-map')) {
      return [
        '**Initialize** an empty hash map to store values you\'ve seen.',
        '**Iterate** through the input. For each element, calculate what complement you need.',
        '**Check** if the complement exists in the map. If yes, return the result immediately.',
        '**Store** the current element in the map for future lookups.',
        '**Return** the result (the problem guarantees at least one valid answer).',
      ]
    }
    if (tags.includes('two-pointers')) {
      return [
        '**Initialize** two pointers — one at the start (left) and one at the end (right) of the array.',
        '**Compare** the values at both pointers. Apply the problem-specific logic.',
        '**Move** the pointer whose value doesn\'t help anymore — typically the smaller or less promising one.',
        '**Repeat** until the pointers meet. Track the best result as you go.',
        '**Return** the optimal result found.',
      ]
    }
    if (tags.includes('dynamic-programming')) {
      return [
        '**Define** the subproblem state (typically `dp[i]` = answer for first i elements).',
        '**Write** the recurrence relation that expresses `dp[i]` in terms of smaller subproblems.',
        '**Initialize** the base cases (`dp[0]`, `dp[1]`) that don\'t depend on earlier results.',
        '**Build** the DP table bottom-up from the base cases to the target.',
        '**Return** `dp[n]` or the tracked maximum/minimum.',
      ]
    }
    if (tags.includes('stack')) {
      return [
        '**Initialize** an empty stack to track pending elements.',
        '**Iterate** through the input. For each element:',
        '  - If it opens a new context (opening bracket, etc.), **push** it onto the stack.',
        '  - If it closes the current context, **pop** from the stack and verify it matches.',
        '**After** processing all elements, check if the stack is empty (all contexts closed).',
        '**Return** true if the stack is empty, false otherwise.',
      ]
    }
    return generic
  }

  function getTimeComplexity() {
    if (tags.includes('hash-table') || tags.includes('hash-map')) return 'O(n) — single pass with O(1) hash map lookups'
    if (tags.includes('two-pointers')) return 'O(n) — each element is visited at most once'
    if (tags.includes('sorting')) return 'O(n log n) — sorting dominates the runtime'
    if (tags.includes('dynamic-programming')) return 'O(n × m) — n elements × m states per element'
    if (tags.includes('binary-search')) return 'O(log n) — half the search space eliminated at each step'
    if (tags.includes('graph') || tags.includes('bfs') || tags.includes('dfs')) return 'O(V + E) — each vertex and edge visited once'
    if (tags.includes('stack')) return 'O(n) — each element pushed and popped at most once'
    return 'O(n) — linear scan of the input'
  }

  function getSpaceComplexity() {
    if (tags.includes('hash-table') || tags.includes('hash-map')) return 'O(n) — hash map stores up to n elements'
    if (tags.includes('two-pointers')) return 'O(1) — only two pointer variables needed'
    if (tags.includes('dynamic-programming')) return 'O(n) — DP array of size n'
    if (tags.includes('sorting')) return 'O(1) or O(n) — depends on sorting implementation'
    if (tags.includes('graph') || tags.includes('bfs') || tags.includes('dfs')) return 'O(V) — queue/stack stores up to V vertices'
    if (tags.includes('stack')) return 'O(n) — stack holds up to n elements in worst case'
    return 'O(1) — constant extra space'
  }

  const steps = getSteps()
  const timeComplexity = getTimeComplexity()
  const spaceComplexity = getSpaceComplexity()

  return `## Approach

${getApproach()}

## Algorithm Steps

${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Complexity Analysis

| Metric | Value |
|--------|-------|
| **Time Complexity** | ${timeComplexity} |
| **Space Complexity** | ${spaceComplexity} |

### Time Complexity Breakdown

${timeComplexity}. ${timeComplexity.includes('O(n log n)') ? 'The sorting step dominates, taking O(n log n). After sorting, a single O(n) pass completes the processing.' : timeComplexity.includes('O(n)') ? 'We visit each element at most once, performing O(1) work per element. No nested loops are needed.' : timeComplexity.includes('O(n²)') ? 'For each of n elements, we may scan or compare against O(n) other elements, leading to quadratic time.' : 'The algorithm eliminates a constant fraction of the search space at each step.'}

### Space Complexity Breakdown

${spaceComplexity}. ${spaceComplexity.includes('O(n)') ? 'An auxiliary data structure proportional to the input size is used to enable fast lookups or store intermediate results.' : 'We only use a fixed number of variables regardless of input size.'}

## Key Insights

${difficulty === 'hard' ? '- The brute force approach gives O(n²), but we can optimize using the right data structure.\n- Look for patterns where we can trade space for time.\n- The problem often has a hidden invariant that makes the optimal solution possible.' : difficulty === 'easy' ? '- The straightforward approach is often the optimal one.\n- Pay attention to edge cases — empty input, single element, duplicates.' : '- If O(n²) works on examples, ask: can we reduce one dimension with a hash map?\n- Consider whether sorting simplifies the problem.'}`
}

function getSolutionCodeFor(problem, lang) {
  const sol = problem.solutions?.[lang] || problem.solution?.[lang] || problem.officialSolution?.[lang]
  if (typeof sol === 'string' && sol.trim()) return sol
  const starter = problem.starterCode?.[lang]
  if (!starter) return null
  // Show the starter as a reference if no official solution
  return null
}

function EditorialContent({ problem, editorial, activeLang, setActiveLang }) {
  const text = useMemo(
    () => editorial?.trim() || buildFallbackEditorial(problem),
    [editorial, problem.tags, problem.difficulty, problem.title]
  )
  const codeForLang = getSolutionCodeFor(problem, activeLang)

  return (
    <div className="space-y-6">
      <MarkdownBlock text={text} />

      <div className="border-t border-gray-800 pt-5">
        <p className="text-sm font-bold text-gray-300 mb-3">Reference Solution</p>
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 mb-3 w-fit">
          {EDITORIAL_LANGS.map(l => (
            <button
              key={l}
              onClick={() => setActiveLang(l)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeLang === l ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        {codeForLang ? (
          <SyntaxHighlight code={codeForLang} language={activeLang} />
        ) : (
          <div className="bg-gray-900/50 border border-dashed border-gray-800 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
            Reference solution for {LANG_LABELS[activeLang]} isn't published yet. The approach above applies to every language — translate the data-structure choice into the idioms of your language of choice. Use the starter code in the editor to begin.
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────────── Main component ───────────── */
export default function ProblemPanel({ problemSlug, problem: propProblem, problemId }) {
  const [problem, setProblem] = useState(propProblem || null)
  const [isLoading, setIsLoading] = useState((!propProblem && !!problemSlug) || (!propProblem && !!problemId))
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('description')
  const [solutions, setSolutions] = useState([])
  const [solutionsLoading, setSolutionsLoading] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [newSolution, setNewSolution] = useState({ code: '', language: 'javascript', explanation: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportType, setReportType] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reporting, setReporting] = useState(false)
  const [revealedHints, setRevealedHints] = useState([])
  const [editorialLang, setEditorialLang] = useState('javascript')
  const { toggle: toggleBookmark, isBookmarked } = useBookmarks()

  useEffect(() => {
    if (propProblem) { setProblem(propProblem); return }
    if (!problemSlug && !problemId) return
    setIsLoading(true)
    getProblem(problemSlug || problemId)
      .then(({ data }) => setProblem(data))
      .catch(err => setError(getErrorMessage(err, 'Failed to load problem')))
      .finally(() => setIsLoading(false))
  }, [problemSlug, propProblem, problemId])

  /* reset revealed hints when problem changes */
  useEffect(() => { setRevealedHints([]) }, [problem?._id])

  useEffect(() => {
    if (activeTab !== 'solutions' || !problem?._id) return
    setSolutionsLoading(true)
    getSolutions(problem._id)
      .then(({ data }) => setSolutions(data.solutions || []))
      .catch(() => {})
      .finally(() => setSolutionsLoading(false))
  }, [activeTab, problem?._id])

  const handleSubmitSolution = async (e) => {
    e.preventDefault()
    if (!newSolution.code.trim()) { toast.error('Please enter your solution code'); return }
    setSubmitting(true)
    try {
      await createSolution(problem._id, newSolution)
      toast.success('Solution submitted!')
      setShowSubmitForm(false)
      setNewSolution({ code: '', language: 'javascript', explanation: '' })
      const { data } = await getSolutions(problem._id)
      setSolutions(data.solutions || [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit solution'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReport = async () => {
    if (!reportType) { toast.error('Please select a report type'); return }
    if (reportDesc.length < 10) { toast.error('Description must be at least 10 characters'); return }
    setReporting(true)
    try {
      const { reportProblem } = await import('../../services/api')
      await reportProblem(problem._id, { type: reportType, description: reportDesc })
      toast.success('Report submitted. Thank you!')
      setShowReport(false); setReportType(''); setReportDesc('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit report'))
    } finally {
      setReporting(false)
    }
  }

  if (isLoading) return (
    <div className="p-5 space-y-4">
      <Skeleton className="h-7 w-2/3" />
      <div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /></div>
      <Skeleton className="h-40 w-full" />
    </div>
  )
  if (error) return <div className="p-5 text-red-400 text-sm">{error}</div>
  if (!problem) return <div className="p-5 text-gray-500 text-sm">No problem selected</div>

  const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go']
  const hints = problem.hints || []
  const editorial = problem.editorial || ''

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'hints', label: `Hints${hints.length ? ` (${hints.length})` : ''}` },
    { id: 'editorial', label: 'Editorial' },
    { id: 'solutions', label: '💡 Solutions' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-gray-800 flex-shrink-0">
        <div className="flex gap-0.5" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors focus:outline-none whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-indigo-400 border-indigo-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1 px-2 py-1.5 mb-1 rounded-lg text-[11px] font-semibold text-red-400 hover:text-white bg-red-600/10 hover:bg-red-600/25 border border-red-600/20 transition-all"
        >
          <Flag className="w-3 h-3" /> Report
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* ── Description ── */}
        {activeTab === 'description' && (
          <div className="space-y-5">
            {/* Title + badge */}
            <div className="flex items-start gap-3">
              <h2 className="text-lg font-bold text-gray-100 flex-1 leading-tight">{problem.title}</h2>
              <button
                onClick={() => toggleBookmark(problem.slug)}
                className={`flex-shrink-0 p-1 rounded transition-colors ${isBookmarked(problem.slug) ? 'text-amber-400' : 'text-gray-600 hover:text-amber-400'}`}
                title={isBookmarked(problem.slug) ? 'Remove bookmark' : 'Bookmark this problem'}
              >
                {isBookmarked(problem.slug) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
              <Badge variant={problem.difficulty?.toLowerCase()}>{problem.difficulty}</Badge>
            </div>

            {/* Tags / companies */}
            {(problem.companies?.length > 0 || problem.tags?.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {(problem.companies || []).map(c => (
                  <span key={c} className="text-[11px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">{c}</span>
                ))}
                {(problem.tags || []).map(t => (
                  <span key={t} className="text-[11px] bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/40">{t}</span>
                ))}
              </div>
            )}

            {/* Description */}
            <DescriptionBlock text={problem.description} />

            {/* Examples */}
            {(problem.examples || []).map((ex, i) => (
              <div key={i} className="bg-gray-900/60 rounded-xl p-4 border border-gray-800 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Example {i + 1}</h4>
                <div className="font-mono text-xs space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 flex-shrink-0 w-16">Input</span>
                    <span className="text-green-400 bg-gray-800/60 px-2 py-0.5 rounded flex-1 break-all">{ex.input}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 flex-shrink-0 w-16">Output</span>
                    <span className="text-blue-400 bg-gray-800/60 px-2 py-0.5 rounded flex-1 break-all">{ex.output}</span>
                  </div>
                  {ex.explanation && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-600 flex-shrink-0 w-16">Note</span>
                      <span className="text-gray-400 flex-1">{ex.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Constraints */}
            {problem.constraints && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Constraints</h4>
                <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800 font-mono text-xs text-gray-400 whitespace-pre-wrap leading-relaxed">
                  {problem.constraints}
                </div>
              </div>
            )}

            {/* Time / memory */}
            {(problem.timeLimit || problem.memoryLimit) && (
              <div className="flex items-center gap-4 text-xs text-gray-600">
                {problem.timeLimit && <span>⏱ {problem.timeLimit}ms limit</span>}
                {problem.memoryLimit && <span>💾 {problem.memoryLimit}MB memory</span>}
              </div>
            )}
          </div>
        )}

        {/* ── Hints ── */}
        {activeTab === 'hints' && (
          <div className="space-y-3">
            {hints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Lightbulb className="w-10 h-10 text-gray-700" />
                <p className="text-sm font-semibold text-gray-500">No hints available</p>
                <p className="text-xs text-gray-700">Try solving it on your own first!</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-600 pb-1">Click a hint card to reveal it. Try to solve the problem with as few hints as possible.</p>
                {hints.map((hint, i) => (
                  <HintCard
                    key={i}
                    hint={hint}
                    index={i}
                    revealed={revealedHints.includes(i)}
                    onReveal={(idx) => setRevealedHints(prev => [...prev, idx])}
                  />
                ))}
                {revealedHints.length > 0 && revealedHints.length < hints.length && (
                  <button
                    onClick={() => setRevealedHints(Array.from({ length: hints.length }, (_, i) => i))}
                    className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-300 border border-dashed border-gray-800 hover:border-gray-700 rounded-xl transition-all"
                  >
                    Reveal all remaining hints
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Editorial ── */}
        {activeTab === 'editorial' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-200">Editorial</p>
                <p className="text-[11px] text-gray-500">{problem.title}</p>
              </div>
            </div>
            <EditorialContent problem={problem} editorial={editorial} activeLang={editorialLang} setActiveLang={setEditorialLang} />
          </div>
        )}

        {/* ── Solutions ── */}
        {activeTab === 'solutions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400 font-medium">
                {solutions.length} solution{solutions.length !== 1 ? 's' : ''} shared
              </p>
              <button
                onClick={() => setShowSubmitForm(!showSubmitForm)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
              >
                {showSubmitForm ? 'Cancel' : '+ Share Solution'}
              </button>
            </div>

            {showSubmitForm && (
              <form onSubmit={handleSubmitSolution} className="bg-gray-900 border border-gray-700/60 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Language</label>
                  <select value={newSolution.language} onChange={e => setNewSolution(p => ({ ...p, language: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Solution Code</label>
                  <textarea value={newSolution.code} onChange={e => setNewSolution(p => ({ ...p, code: e.target.value }))} rows={10}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Explanation <span className="text-gray-600 font-normal">(optional)</span></label>
                  <textarea value={newSolution.explanation} onChange={e => setNewSolution(p => ({ ...p, explanation: e.target.value }))} rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all">
                  {submitting ? 'Submitting…' : 'Submit Solution'}
                </button>
              </form>
            )}

            {solutionsLoading ? (
              <div className="space-y-3">{[1,2,3].map(idx => <Skeleton key={idx} className="h-28 w-full" />)}</div>
            ) : solutions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Code2 className="w-10 h-10 text-gray-700" />
                <p className="text-sm font-semibold text-gray-500">No solutions yet</p>
                <p className="text-xs text-gray-700">Be the first to share your approach!</p>
              </div>
            ) : (
              solutions.map(s => (
                <div key={s._id} className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold">
                        {(s.user?.username || 'A')[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-300">{s.user?.username || 'Anonymous'}</span>
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                      {s.language}
                    </span>
                  </div>
                  <pre className="bg-gray-950 rounded-xl p-4 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed border border-gray-800">
                    <code>{s.code}</code>
                  </pre>
                  {s.explanation && <p className="text-sm text-gray-400 leading-relaxed">{s.explanation}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowReport(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-100 mb-4">Report: {problem.title}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Issue Type</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Select type…</option>
                  <option value="wrong-answer">Wrong Expected Answer</option>
                  <option value="broken-testcase">Broken Test Case</option>
                  <option value="unclear-description">Unclear Description</option>
                  <option value="missing-editorial">Missing Editorial</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Description</label>
                <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} rows={4} maxLength={500}
                  placeholder="Describe the issue in detail…"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <p className="text-[11px] text-gray-600 mt-1">{reportDesc.length}/500</p>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowReport(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 transition-all">Cancel</button>
                <button onClick={handleReport} disabled={reporting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-all">
                  {reporting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
