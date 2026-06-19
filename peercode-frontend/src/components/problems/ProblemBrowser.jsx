import { useState, useEffect, useCallback } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { getProblems } from '../../services/api'
import Skeleton from '../common/Skeleton'
import Badge from '../common/Badge'

export default function ProblemBrowser({ onSelectProblem, onClose }) {
  const [problems, setProblems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)

  const loadProblems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const filters = { limit: 20, page }
      if (searchQuery) filters.search = searchQuery
      if (difficulty !== 'all') filters.difficulty = difficulty

      const { data } = await getProblems(filters)
      setProblems(data.problems || data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load problems')
      setProblems([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, difficulty, page])

  useEffect(() => {
    loadProblems()
  }, [loadProblems])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-gray-100">Select a Problem</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-800 bg-gray-950 space-y-3">
          <div className="flex gap-2 items-center">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 items-center overflow-x-auto pb-2">
            {['all', 'easy', 'medium', 'hard'].map(d => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d)
                  setPage(1)
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                  difficulty === d
                    ? d === 'easy' ? 'bg-green-700 text-white'
                      : d === 'medium' ? 'bg-amber-700 text-white'
                      : d === 'hard' ? 'bg-red-700 text-white'
                      : 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Problems List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 p-4">
              <p className="text-red-400 text-sm">{error}</p>
              <button onClick={loadProblems} className="text-xs text-indigo-400 hover:text-indigo-300 underline">
                Try again
              </button>
            </div>
          ) : problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Search className="w-6 h-6 text-gray-600" />
              <p className="text-gray-500">No problems found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {problems.map(problem => (
                <button
                  key={problem._id || problem.id}
                  onClick={() => {
                    onSelectProblem(problem)
                    onClose()
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-gray-800/50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-100 truncate">{problem.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{problem.description?.slice(0, 100)}</p>
                    {problem.tags?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {problem.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Badge variant={problem.difficulty?.toLowerCase()}>{problem.difficulty}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {problems.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-800 bg-gray-950 flex gap-2 justify-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-300 rounded-lg transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-400">Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
