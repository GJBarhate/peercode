import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Flag, Code2, ThumbsUp, Clock, User } from 'lucide-react'
import Badge from '../common/Badge'
import Skeleton from '../common/Skeleton'
import { getProblem, getSolutions, createSolution, getErrorMessage } from '../../services/api'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    if (propProblem) { setProblem(propProblem); return }
    if (!problemSlug && !problemId) return
    async function load() {
      setIsLoading(true)
      try {
        const { data } = await getProblem(problemSlug || problemId)
        setProblem(data)
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load problem'))
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [problemSlug, propProblem, problemId])

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
    if (!newSolution.language) { toast.error('Please select a language'); return }
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
      setShowReport(false)
      setReportType('')
      setReportDesc('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit report'))
    } finally {
      setReporting(false)
    }
  }

  if (isLoading) {
    return <div className="p-5 space-y-4"><Skeleton className="h-7 w-2/3" /><div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /></div><Skeleton className="h-40 w-full" /></div>
  }
  if (error) return <div className="p-5 text-red-400 text-sm">{error}</div>
  if (!problem) return <div className="p-5 text-gray-500 text-sm">No problem selected</div>

  const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go']

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-800 flex-shrink-0">
        <div className="flex gap-1" role="tablist">
          {['description', 'hints', 'editorial', 'solutions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} role="tab" aria-selected={activeTab === tab}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize focus:outline-none rounded-t ${
                activeTab === tab ? 'text-indigo-400 border-indigo-500' : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}>{tab === 'solutions' ? '💡 Solutions' : tab}</button>
          ))}
        </div>
        <button onClick={() => setShowReport(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-white bg-red-600/10 hover:bg-red-600/30 border border-red-600/30 transition-all"
          title="Report a problem with this question">
          <Flag className="w-3 h-3" /> Report
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'description' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <h2 className="text-lg font-bold text-gray-100 flex-1">{problem.title}</h2>
              <Badge variant={problem.difficulty?.toLowerCase()}>{problem.difficulty}</Badge>
            </div>
            {(problem.companies?.length > 0 || problem.tags?.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {(problem.companies || []).map(c => <span key={c} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">{c}</span>)}
                {(problem.tags || []).map(t => <span key={t} className="text-xs bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/40">{t}</span>)}
              </div>
            )}
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{problem.description}</div>
            {(problem.examples || []).map((ex, i) => (
              <div key={i} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Example {i + 1}</h4>
                <div className="font-mono text-xs space-y-1">
                  <div><span className="text-gray-500">Input: </span><span className="text-green-400">{ex.input}</span></div>
                  <div><span className="text-gray-500">Output: </span><span className="text-blue-400">{ex.output}</span></div>
                  {ex.explanation && <div><span className="text-gray-500">Explanation: </span><span className="text-gray-400">{ex.explanation}</span></div>}
                </div>
              </div>
            ))}
            {problem.constraints && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Constraints</h4>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 font-mono text-xs text-gray-400 whitespace-pre-wrap">{problem.constraints}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hints' && (
          <div className="space-y-3">
            {(problem.hints || []).length === 0 ? (
              <p className="text-gray-500 text-sm">No hints available for this problem.</p>
            ) : (
              problem.hints.map((hint, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <span className="text-xs font-semibold text-indigo-400">Hint {i + 1}</span>
                  <p className="text-gray-300 text-sm mt-2">{hint}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'editorial' && (
          <div className="space-y-4">
            {problem.editorial ? (
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{problem.editorial}</div>
            ) : (
              <p className="text-gray-500 text-sm">Editorial not yet available.</p>
            )}
          </div>
        )}

        {activeTab === 'solutions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">{solutions.length} solution{solutions.length !== 1 ? 's' : ''}</p>
              <button onClick={() => setShowSubmitForm(!showSubmitForm)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
                {showSubmitForm ? 'Cancel' : '+ Submit Your Solution'}
              </button>
            </div>

            {showSubmitForm && (
              <form onSubmit={handleSubmitSolution} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Language</label>
                  <select value={newSolution.language} onChange={e => setNewSolution(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    {languages.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Your Solution Code</label>
                  <textarea value={newSolution.code} onChange={e => setNewSolution(prev => ({ ...prev, code: e.target.value }))} rows={10}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Explanation (optional)</label>
                  <textarea value={newSolution.explanation} onChange={e => setNewSolution(prev => ({ ...prev, explanation: e.target.value }))} rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all">
                  {submitting ? 'Submitting...' : 'Submit Solution'}
                </button>
              </form>
            )}

            {solutionsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : solutions.length === 0 ? (
              <div className="text-center py-12">
                <Code2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No solutions yet. Be the first to share yours!</p>
              </div>
            ) : (
              solutions.map(s => (
                <div key={s._id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      <span className="font-medium text-gray-400">{s.user?.username || 'Anonymous'}</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">{s.language}</span>
                  </div>
                  <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed"><code>{s.code}</code></pre>
                  {s.explanation && <p className="text-sm text-gray-400">{s.explanation}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowReport(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-100 mb-4">Report: {problem.title}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Issue Type</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Select type...</option>
                  <option value="wrong-answer">Wrong Answer</option>
                  <option value="broken-testcase">Broken Test Case</option>
                  <option value="unclear-description">Unclear Description</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} rows={4} maxLength={500} placeholder="Describe the issue (10-500 chars)..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <p className="text-xs text-gray-600 mt-1">{reportDesc.length}/500</p>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowReport(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 transition-all">Cancel</button>
                <button onClick={handleReport} disabled={reporting} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-all">
                  {reporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
