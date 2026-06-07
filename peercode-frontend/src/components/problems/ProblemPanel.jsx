import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import Badge from '../common/Badge'
import Skeleton from '../common/Skeleton'
import { getProblem } from '../../services/api'

export default function ProblemPanel({ problemSlug, problem: propProblem, problemId }) {
  const [problem, setProblem] = useState(propProblem || null)
  const [isLoading, setIsLoading] = useState((!propProblem && !!problemSlug) || (!propProblem && !!problemId))
  const [error, setError] = useState(null)
  const [hintsExpanded, setHintsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    if (propProblem) { setProblem(propProblem); return }
    if (!problemSlug) return
    async function load() {
      setIsLoading(true)
      try {
        const { data } = await getProblem(problemSlug)
        setProblem(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load problem')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [problemSlug, propProblem])

  if (isLoading) {
    return (
      <div className="p-5 space-y-4">
        <Skeleton className="h-7 w-2/3" />
        <div className="flex gap-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /></div>
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error) {
    return <div className="p-5 text-red-400 text-sm">{error}</div>
  }

  if (!problem) {
    return <div className="p-5 text-gray-500 text-sm">No problem selected</div>
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex gap-1 px-4 pt-4 pb-2 border-b border-gray-800 flex-shrink-0" role="tablist" aria-label="Problem details tabs">
        {['description', 'hints', 'editorial'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 rounded-t ${
              activeTab === tab
                ? 'text-indigo-400 border-indigo-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
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
                {(problem.companies || []).map(c => (
                  <span key={c} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">{c}</span>
                ))}
                {(problem.tags || []).map(t => (
                  <span key={t} className="text-xs bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/40">{t}</span>
                ))}
              </div>
            )}

            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {problem.description}
            </div>

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
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 font-mono text-xs text-gray-400 whitespace-pre-wrap">
                  {problem.constraints}
                </div>
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-indigo-400">Hint {i + 1}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{hint}</p>
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
      </div>
    </div>
  )
}
