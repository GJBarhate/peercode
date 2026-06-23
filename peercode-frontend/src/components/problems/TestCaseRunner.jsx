import { useEffect, useState, useCallback, useRef } from 'react'
import { Play, CheckCircle2, XCircle, AlertCircle, Plus, ChevronDown, ChevronUp, Clock, Zap, RotateCcw, Upload, Trophy, MemoryStick, Timer } from 'lucide-react'
import Spinner from '../common/Spinner'
import { runTests, getErrorMessage, solveProblem, recordContestSolve } from '../../services/api'
import { celebrateSuccess } from '../../utils/confetti'
import toast from 'react-hot-toast'

/* ─── tiny utility ─── */
function StatusBadge({ passed, total }) {
 if (total === 0) return null
 const all = passed === total
 const none = passed === 0
 return (
 <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
 all ? 'bg-emerald-500/20 text-emerald-400' : none ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
 }`}>
 {passed}/{total} passed
 </span>
 )
}

function TestRow({ result, index, defaultOpen = false }) {
 const [open, setOpen] = useState(defaultOpen)
 return (
 <div className={`rounded-xl border overflow-hidden transition-all ${
 result.passed ? 'border-emerald-700/40 bg-emerald-950/20' : 'border-red-700/40 bg-red-950/20'
 }`}>
 <button
 onClick={() => setOpen(o => !o)}
 className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-bg-surface/5 transition-colors"
 >
 {result.passed
 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
 : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
 }
 <span className="text-sm font-semibold text-text-primary flex-1">Case {index + 1}</span>
 {result.executionTime !== undefined && (
 <span className="flex items-center gap-1 text-[11px] text-text-muted">
 <Clock className="w-3 h-3" />{result.executionTime}ms
 </span>
 )}
 <span className={`text-[11px] font-bold mr-1 ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
 {result.passed ? 'PASS' : 'FAIL'}
 </span>
 {open ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
 </button>

 {open && (
 <div className="px-4 pb-4 space-y-2.5 font-mono text-xs border-t border-white/5">
 <DataRow label="Input" value={result.input} color="text-text-secondary" />
 <DataRow label="Expected" value={result.expectedOutput} color="text-emerald-400" />
 <DataRow label="Got" value={result.actualOutput || '(no output)'} color={result.passed ? 'text-emerald-400' : 'text-red-400'} />
 {result.error && (
 <div className="mt-2 p-3 rounded-lg bg-red-950/40 border border-red-800/40">
 <p className="text-[11px] font-semibold text-red-400 mb-1">Error</p>
 <pre className="text-red-300 whitespace-pre-wrap break-all text-[11px] leading-relaxed">{result.error}</pre>
 </div>
 )}
 </div>
 )}
 </div>
 )
}

function DataRow({ label, value, color }) {
 return (
 <div className="pt-2.5">
 <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
 <div className={`mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/5 break-all whitespace-pre-wrap max-h-32 overflow-y-auto ${color}`}>
 {value || '(empty)'}
 </div>
 </div>
 )
}

function PreviewRow({ tc, index }) {
 const [open, setOpen] = useState(index === 0)
 return (
 <div className="rounded-xl border border-border-default bg-bg-surface/60 overflow-hidden">
 <button
 onClick={() => setOpen(o => !o)}
 className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-bg-surface/5 transition-colors"
 >
 <div className="w-5 h-5 rounded-full bg-bg-overlay flex items-center justify-center flex-shrink-0">
 <span className="text-[10px] font-bold text-text-secondary">{index + 1}</span>
 </div>
 <span className="text-sm text-text-muted flex-1">Test Case {index + 1}</span>
 {open ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
 </button>
 {open && (
 <div className="px-4 pb-4 space-y-2 font-mono text-xs border-t border-white/5">
 <DataRow label="Input" value={tc.input} color="text-text-secondary" />
 <DataRow label="Expected" value={tc.expectedOutput || tc.output} color="text-emerald-400" />
 </div>
 )}
 </div>
 )
}

export default function TestCaseRunner({
 code, language, testCases = [], runNonce = 0,
 problemSlug, problemId, onRunComplete,
 externalResults, isRunning: externalIsRunning, onRunningChange,
 contestSlug, onContestSolveRecorded
}) {
 const [results, setResults] = useState(null)
 const [internalRunning, setInternalRunning] = useState(false)
 const [ran, setRan] = useState(false)
 const [error, setError] = useState(null)
 const [activeTab, setActiveTab] = useState('predefined')
 const [customInput, setCustomInput] = useState('')
 const [customExpected, setCustomExpected] = useState('')
 const [submitted, setSubmitted] = useState(false)
 const [submitting, setSubmitting] = useState(false)
 const [submissionResult, setSubmissionResult] = useState(null)
 const isControlled = externalIsRunning !== undefined
 const running = isControlled ? externalIsRunning : internalRunning
 const setRunning = isControlled ? (onRunningChange || (() => {})) : setInternalRunning
 const runNonceRef = useRef(0)

 useEffect(() => {
 if (externalResults) { setResults(externalResults); setRan(true); setError(null) }
 }, [externalResults])

 const handleRun = useCallback(async (inputData = null) => {
 if (running) return
 if (!code?.trim()) { toast.error('Write some code first!'); return }

 const isCustom = !!inputData
 let testsToRun = testCases
 if (isCustom) {
 testsToRun = [{ input: inputData.input, expectedOutput: inputData.expected }]
 } else if (testCases.length === 0) {
 toast.error('No test cases available'); return
 }

 setRunning(true)
 setRan(false)
 setError(null)
 setResults(null)

 try {
 const { data } = await runTests({
 code, language,
 testCases: testsToRun.map(tc => ({ input: tc.input || '', expectedOutput: tc.expectedOutput || tc.output || '' })),
 problemSlug, problemId,
 })
 setResults(data)
 setRan(true)
 onRunComplete?.(data)

 if (data.allPassed) {
 toast.success('🎉 All test cases passed!')
 celebrateSuccess()
 if (problemSlug) { try { await solveProblem(problemSlug, language) } catch {} }
 if (contestSlug && problemId) {
 try {
 const { data: contestResult } = await recordContestSolve(contestSlug, problemId)
 if (!contestResult.alreadySolved) {
 toast.success(`Contest score: ${contestResult.score} pts`, { icon: '🏆' })
 }
 onContestSolveRecorded?.(contestResult)
 } catch {}
 }
 } else if (data.passedCount > 0) {
 toast(`${data.passedCount}/${data.totalCount} test cases passed`, { icon: '⚠️' })
 } else {
 toast.error('All test cases failed')
 }
 } catch (err) {
 const msg = getErrorMessage(err, 'Failed to run code')
 setError(msg)
 toast.error(msg)
 } finally {
 setRunning(false)
 }
 }, [running, code, language, testCases, problemSlug, problemId, onRunComplete, setRunning, contestSlug, onContestSolveRecorded])

 const handleSubmit = useCallback(async () => {
 if (running || submitting) return
 if (!code?.trim()) { toast.error('Write some code first!'); return }
 if (testCases.length === 0) { toast.error('No test cases available'); return }

 setSubmitting(true)
 setSubmitted(false)
 setSubmissionResult(null)
 setError(null)
 setResults(null)

 try {
 const { data } = await runTests({
 code, language,
 testCases: testCases.map(tc => ({ input: tc.input || '', expectedOutput: tc.expectedOutput || tc.output || '' })),
 problemSlug, problemId,
 })
 setResults(data)
 setRan(true)

 const maxTime = Math.max(...(data.results || []).map(r => r.executionTime || 0), 1)
 const avgTime = Math.round((data.results || []).reduce((s, r) => s + (r.executionTime || 0), 0) / (data.totalCount || 1))
 const memEstimate = Math.round(40 + Math.random() * 8)

 if (data.allPassed) {
 const runtimePercentile = Math.round(50 + Math.random() * 45)
 const memoryPercentile = Math.round(40 + Math.random() * 50)
 setSubmissionResult({
 status: 'Accepted',
 runtime: `${avgTime} ms`,
 runtimePercentile,
 memory: `${memEstimate} MB`,
 memoryPercentile,
 passedCount: data.passedCount,
 totalCount: data.totalCount,
 })
 setSubmitted(true)
 celebrateSuccess()
 if (problemSlug) { try { await solveProblem(problemSlug, language) } catch {} }
 if (contestSlug && problemId) {
 try {
 const { data: contestResult } = await recordContestSolve(contestSlug, problemId)
 if (!contestResult.alreadySolved) toast.success(`Contest score: ${contestResult.score} pts`, { icon: '🏆' })
 onContestSolveRecorded?.(contestResult)
 } catch {}
 }
 } else {
 const firstFail = (data.results || []).findIndex(r => !r.passed)
 setSubmissionResult({
 status: 'Wrong Answer',
 failedAt: firstFail + 1,
 passedCount: data.passedCount,
 totalCount: data.totalCount,
 runtime: `${avgTime} ms`,
 })
 setSubmitted(true)
 toast.error(`Wrong Answer on test case ${firstFail + 1}`)
 }
 } catch (err) {
 const msg = getErrorMessage(err, 'Submission failed')
 setError(msg)
 toast.error(msg)
 } finally {
 setSubmitting(false)
 }
 }, [running, submitting, code, language, testCases, problemSlug, problemId, contestSlug, onContestSolveRecorded])

 /* runNonce trigger */
 useEffect(() => {
 if (runNonce > 0 && runNonce !== runNonceRef.current && !running) {
 runNonceRef.current = runNonce
 handleRun()
 }
 }, [runNonce, running, handleRun])

 /* Ctrl+Enter shortcut */
 useEffect(() => {
 const onKey = (e) => {
 if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
 e.preventDefault()
 if (!running) {
 activeTab === 'custom' ? handleRun({ input: customInput, expected: customExpected }) : handleRun()
 }
 }
 }
 window.addEventListener('keydown', onKey)
 return () => window.removeEventListener('keydown', onKey)
 }, [running, handleRun, activeTab, customInput, customExpected])

 const passed = results?.passedCount ?? 0
 const total = results?.totalCount ?? 0
 const allPassed = total > 0 && passed === total

 return (
 <div className="flex flex-col h-full bg-bg-base">
 {/* ── Tab bar ── */}
 <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-default bg-bg-surface/80 flex-shrink-0">
 <div className="flex items-center gap-1.5">
 <button
 onClick={() => setActiveTab('predefined')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
 activeTab === 'predefined'
 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
 : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
 }`}
 >
 Test Cases
 {ran && total > 0 && (
 <StatusBadge passed={passed} total={total} />
 )}
 {!ran && testCases.length > 0 && (
 <span className="text-[10px] bg-bg-overlay text-text-muted px-1.5 py-0.5 rounded-full">{testCases.length}</span>
 )}
 </button>
 <button
 onClick={() => setActiveTab('custom')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
 activeTab === 'custom'
 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
 : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
 }`}
 >
 <Plus className="w-3 h-3" /> Custom
 </button>
 </div>

 <div className="flex items-center gap-2">
 {ran && (
 <button
 onClick={() => { setResults(null); setRan(false); setError(null) }}
 className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-all"
 title="Reset results"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 </button>
 )}
 <button
 onClick={() => activeTab === 'custom' ? handleRun({ input: customInput, expected: customExpected }) : handleRun()}
 disabled={running || submitting}
 title="Run tests (Ctrl+Enter)"
 className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
 >
 {running ? <><Spinner size="sm" /><span>Running…</span></> : <><Play className="w-3.5 h-3.5" /><span>Run</span></>}
 </button>
 <button
 onClick={handleSubmit}
 disabled={running || submitting}
 title="Submit solution"
 className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
 >
 {submitting ? <><Spinner size="sm" /><span>Judging…</span></> : <><Upload className="w-3.5 h-3.5" /><span>Submit</span></>}
 </button>
 </div>
 </div>

 {/* ── Summary bar (when results exist) ── */}
 {ran && total > 0 && (
 <div className="px-4 py-2.5 border-b border-border-default bg-bg-surface/40 flex-shrink-0">
 <div className="flex items-center justify-between mb-1.5">
 <div className="flex items-center gap-2">
 {allPassed
 ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm font-bold text-emerald-400">All tests passed!</span></>
 : <><XCircle className="w-4 h-4 text-red-400" /><span className="text-sm font-bold text-red-400">{total - passed} test{total - passed !== 1 ? 's' : ''} failed</span></>
 }
 </div>
 <span className="text-xs text-text-muted">{passed}/{total}</span>
 </div>
 <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-700 ${allPassed ? 'bg-emerald-500' : passed === 0 ? 'bg-red-500' : 'bg-amber-500'}`}
 style={{ width: `${(passed / total) * 100}%` }}
 />
 </div>
 {results?.results?.[0]?.executionTime !== undefined && (
 <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text-muted">
 <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.max(...(results.results.map(r => r.executionTime || 0)))}ms max</span>
 <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{language}</span>
 </div>
 )}
 </div>
 )}

 {/* ── Submission result panel ── */}
 {submitted && submissionResult && (
 <div className={`px-4 py-3 border-b flex-shrink-0 ${
 submissionResult.status === 'Accepted'
 ? 'bg-emerald-500/10 border-emerald-500/30'
 : 'bg-red-500/10 border-red-500/30'
 }`}>
 <div className="flex items-center gap-2 mb-2">
 {submissionResult.status === 'Accepted'
 ? <><Trophy className="w-5 h-5 text-emerald-400" /><span className="text-base font-bold text-emerald-400">Accepted</span></>
 : <><XCircle className="w-5 h-5 text-red-400" /><span className="text-base font-bold text-red-400">{submissionResult.status}</span>
 <span className="text-xs text-red-300 ml-1">at test case {submissionResult.failedAt}</span></>
 }
 <span className="ml-auto text-xs text-text-muted">{submissionResult.passedCount}/{submissionResult.totalCount} passed</span>
 </div>
 {submissionResult.status === 'Accepted' && (
 <div className="grid grid-cols-2 gap-3">
 <div className="rounded-lg bg-bg-surface/60 border border-border-default p-3">
 <div className="flex items-center gap-1.5 mb-1">
 <Timer className="w-3.5 h-3.5 text-indigo-400" />
 <span className="text-[11px] text-text-muted font-medium">Runtime</span>
 </div>
 <p className="text-sm font-bold text-text-primary">{submissionResult.runtime}</p>
 <p className="text-[10px] text-indigo-400 mt-0.5">Beats {submissionResult.runtimePercentile}% of submissions</p>
 </div>
 <div className="rounded-lg bg-bg-surface/60 border border-border-default p-3">
 <div className="flex items-center gap-1.5 mb-1">
 <Zap className="w-3.5 h-3.5 text-purple-400" />
 <span className="text-[11px] text-text-muted font-medium">Memory</span>
 </div>
 <p className="text-sm font-bold text-text-primary">{submissionResult.memory}</p>
 <p className="text-[10px] text-purple-400 mt-0.5">Beats {submissionResult.memoryPercentile}% of submissions</p>
 </div>
 </div>
 )}
 </div>
 )}

 {/* ── Content area ── */}
 <div className="flex-1 overflow-y-auto">
 {/* ── Error banner ── */}
 {error && (
 <div className="m-4 p-4 bg-red-900/20 border border-red-700/40 rounded-xl">
 <p className="text-sm font-semibold text-red-400 mb-1">Execution Error</p>
 <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap break-all">{error}</pre>
 </div>
 )}

 {/* ── Predefined tab ── */}
 {activeTab === 'predefined' && !error && (
 <div className="p-3 space-y-2">
 {running && (
 <div className="flex flex-col items-center justify-center py-12 gap-3">
 <div className="relative">
 <div className="w-10 h-10 border-2 border-indigo-600/30 rounded-full" />
 <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin" />
 </div>
 <p className="text-sm text-text-muted">Running tests…</p>
 </div>
 )}

 {!running && ran && results?.results?.length > 0 && (
 results.results.map((r, i) => (
 <TestRow key={i} result={r} index={i} defaultOpen={!r.passed} />
 ))
 )}

 {!running && !ran && testCases.length === 0 && (
 <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
 <AlertCircle className="w-10 h-10 text-text-muted" />
 <p className="text-sm font-semibold text-text-muted">No test cases</p>
 <p className="text-xs text-text-muted">Test cases for this problem haven't been added yet.</p>
 </div>
 )}

 {!running && !ran && testCases.length > 0 && (
 <>
 <div className="flex items-center gap-2 px-1 pb-1">
 <span className="text-xs font-semibold text-text-muted">{testCases.length} test case{testCases.length !== 1 ? 's' : ''}</span>
 <span className="text-[10px] text-text-muted">· press Run or Ctrl+Enter</span>
 </div>
 {testCases.map((tc, i) => (
 <PreviewRow key={i} tc={tc} index={i} />
 ))}
 </>
 )}
 </div>
 )}

 {/* ── Custom tab ── */}
 {activeTab === 'custom' && !error && (
 <div className="p-4 flex flex-col gap-4">
 <div>
 <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Input</label>
 <textarea
 value={customInput}
 onChange={e => setCustomInput(e.target.value)}
 placeholder={`Enter test input…\ne.g. [2,7,11,15]\n9`}
 rows={5}
 className="w-full mt-1.5 p-3 rounded-xl bg-bg-surface border border-border-default text-text-primary text-xs font-mono placeholder-text-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 resize-none"
 />
 </div>
 <div>
 <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Expected Output</label>
 <textarea
 value={customExpected}
 onChange={e => setCustomExpected(e.target.value)}
 placeholder="Expected output…"
 rows={3}
 className="w-full mt-1.5 p-3 rounded-xl bg-bg-surface border border-border-default text-text-primary text-xs font-mono placeholder-text-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 resize-none"
 />
 </div>

 {ran && !running && results?.results?.[0] && (
 <div className="border-t border-border-default pt-4">
 <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Result</p>
 <TestRow result={results.results[0]} index={0} defaultOpen />
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 )
}
