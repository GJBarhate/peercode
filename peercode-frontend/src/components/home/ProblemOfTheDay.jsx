import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flame, ArrowRight, Clock } from 'lucide-react'
import { API_BASE_URL } from '../../services/api'

const difficultyColors = {
  easy: 'bg-green-500/10 text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  hard: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function ProblemOfTheDay() {
  const [problem, setProblem] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/problems/daily`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.problem) setProblem(data.problem)
        else if (data?.title) setProblem(data)
      })
      .catch(() => {})
  }, [])

  if (!problem) return null

  return (
    <div className="bg-gray-900/60 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Flame className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-bold text-gray-100">Problem of the Day</h3>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-200 text-lg mb-2 truncate">{problem.title}</h4>
          <div className="flex items-center gap-3 mb-3">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${difficultyColors[problem.difficulty] || difficultyColors.medium}`}>
              {problem.difficulty}
            </span>
            {problem.tags?.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-gray-500">#{tag}</span>
            ))}
          </div>
          {problem.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{problem.description}</p>
          )}
        </div>
        <Link
          to={`/problems/${problem.slug}`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors whitespace-nowrap"
        >
          Solve
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
