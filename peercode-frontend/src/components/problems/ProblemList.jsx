import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Users, Building2 } from 'lucide-react'
import Badge from '../common/Badge'
import Skeleton from '../common/Skeleton'
import { getProblems } from '../../services/api'

export default function ProblemList({ filters = {}, onPractice }) {
  const [problems, setProblems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const stableFilters = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const { data } = await getProblems(JSON.parse(stableFilters))
        setProblems(data.problems || data || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load problems')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [stableFilters])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => setError(null)}
          className="btn-secondary text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (problems.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">No problems found matching your filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {problems.map(problem => (
        <div key={problem._id || problem.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/problems/${problem.slug}`}
              className="font-semibold text-gray-100 hover:text-indigo-400 transition-colors leading-tight"
            >
              {problem.title}
            </Link>
            <Badge variant={problem.difficulty?.toLowerCase() || 'default'}>
              {problem.difficulty}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(problem.companies || []).slice(0, 3).map(c => (
              <span key={c} className="inline-flex items-center gap-1 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
                <Building2 className="w-3 h-3" />
                {c}
              </span>
            ))}
            {(problem.tags || []).slice(0, 2).map(t => (
              <span key={t} className="text-xs bg-indigo-900/40 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/50">
                {t}
              </span>
            ))}
          </div>

          {problem.acceptanceRate != null && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3 h-3" />
              <span>{problem.acceptanceRate}% acceptance</span>
            </div>
          )}

          <div className="flex gap-2 mt-auto pt-1">
            <Link
              to={`/problems/${problem.slug}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View
            </Link>
            {onPractice && (
              <button
                onClick={() => onPractice(problem)}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Practice
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
