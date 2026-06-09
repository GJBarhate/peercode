import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Clock, BookOpen, Users, Trophy, Search, BarChart3, Sparkles, Target, ChevronRight } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import ErrorState from '../components/common/ErrorState'
import CompanyLogo from '../components/common/CompanyLogo'
import Skeleton from '../components/common/Skeleton'
import Modal from '../components/common/Modal'
import MatchingQueue from '../components/room/MatchingQueue'
import { getTrack, getTrackProgress, getErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const DIFF_COLORS = {
  easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  hard: 'text-red-400 bg-red-500/10 border-red-500/30',
}

const DIFF_BG = {
  easy: 'bg-emerald-500/20',
  medium: 'bg-amber-500/20',
  hard: 'bg-red-500/20',
}

export default function TrackDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [track, setTrack] = useState(null)
  const [progress, setProgress] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showQueueModal, setShowQueueModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const [trackRes, progressRes] = await Promise.allSettled([
        getTrack(slug),
        user ? getTrackProgress(slug) : Promise.reject('not logged in')
      ])
      if (trackRes.status === 'fulfilled') setTrack(trackRes.value.data)
      else throw trackRes.reason
      if (progressRes.status === 'fulfilled') setProgress(progressRes.value.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Track not found'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [slug, user])

  const handleSolveProblem = (entry) => {
    const inner = entry.problem && typeof entry.problem === 'object' ? entry.problem : null
    const slug = inner?.slug || entry.slug || entry.problem
    if (!slug) { toast.error('Problem data not available'); return }
    navigate(`/problems/${slug}`)
  }

  const problems = track?.problems || []
  const completedIds = new Set(progress?.completedProblems || [])
  const completedCount = completedIds.size
  const total = problems.length
  const pct = total > 0 ? (completedCount / total) * 100 : 0

  const diffCounts = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0 }
    problems.forEach(entry => {
      const p = entry.problem && typeof entry.problem === 'object' ? entry.problem : entry
      if (p.difficulty === 'hard') counts.hard++
      else if (p.difficulty === 'medium') counts.medium++
      else counts.easy++
    })
    return counts
  }, [problems])

  const filteredProblems = useMemo(() => {
    if (!searchQuery.trim()) return problems
    const q = searchQuery.toLowerCase()
    return problems.filter(entry => {
      const p = entry.problem && typeof entry.problem === 'object' ? entry.problem : entry
      return p.title?.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q))
    })
  }, [problems, searchQuery])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full" />
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <ErrorState error={error} title="Failed to Load Track" onRetry={load} onGoHome={() => navigate('/tracks')} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <Link to="/tracks" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          All Tracks
        </Link>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-950 p-6 sm:p-8 mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-start gap-4 sm:gap-6">
            <CompanyLogo company={track?.company} size="w-16 h-16 sm:w-20 sm:h-20" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{track?.name}</h1>
                {track?.company && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
                    {track.company}
                  </span>
                )}
              </div>
              {track?.description && <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-2xl">{track.description}</p>}
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-indigo-400" />{total} problems</span>
                {track?.estimatedHours && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" />{track.estimatedHours}h estimated</span>}
                <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-emerald-400" />{diffCounts.easy} easy · {diffCounts.medium} medium · {diffCounts.hard} hard</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {user && total > 0 && (
            <div className="relative mt-6 pt-5 border-t border-gray-800">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400 font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  Progress
                </span>
                <span className="text-gray-500">{completedCount}/{total} <span className="text-gray-600">({Math.round(pct)}%)</span></span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {progress?.completedAt && (
            <div className="relative mt-4 flex items-center gap-2 p-3 bg-green-900/20 border border-green-800/40 rounded-xl">
              <Trophy className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-400 font-medium">Track completed on {new Date(progress.completedAt).toLocaleDateString()}!</p>
            </div>
          )}
        </div>

        {/* Difficulty Distribution */}
        {total > 0 && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
            <BarChart3 className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <div className="flex-1 flex gap-1 h-2.5 rounded-full overflow-hidden bg-gray-800">
              {diffCounts.easy > 0 && <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(diffCounts.easy / total) * 100}%` }} />}
              {diffCounts.medium > 0 && <div className="bg-amber-500 h-full transition-all" style={{ width: `${(diffCounts.medium / total) * 100}%` }} />}
              {diffCounts.hard > 0 && <div className="bg-red-500 h-full transition-all" style={{ width: `${(diffCounts.hard / total) * 100}%` }} />}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-shrink-0">
              {diffCounts.easy > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Easy {diffCounts.easy}</span>}
              {diffCounts.medium > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Medium {diffCounts.medium}</span>}
              {diffCounts.hard > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Hard {diffCounts.hard}</span>}
            </div>
          </div>
        )}

        {/* Search */}
        {problems.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search problems by title or tag..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all"
            />
          </div>
        )}

        {/* Problem List */}
        <div className="space-y-2.5">
          {filteredProblems.length === 0 && searchQuery && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No problems match your search</p>
            </div>
          )}
          {filteredProblems.map((entry, i) => {
            const problem = (entry.problem && typeof entry.problem === 'object' && entry.problem.slug) ? entry.problem : entry
            const done = completedIds.has(problem._id || problem.id || problem.slug)
            const diffColor = DIFF_COLORS[problem.difficulty] || DIFF_COLORS.easy
            return (
              <div
                key={problem._id || problem.slug || i}
                className={`group relative overflow-hidden rounded-xl border p-4 flex items-center gap-3 sm:gap-4 transition-all duration-200 cursor-pointer hover:scale-[1.01] ${
                  done
                    ? 'bg-emerald-900/10 border-emerald-800/30 hover:border-emerald-600/50'
                    : 'bg-gray-900/50 border-gray-800 hover:border-indigo-500/40 hover:bg-gray-900'
                }`}
                onClick={() => handleSolveProblem(problem)}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold flex-shrink-0 transition-all ${
                  done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500 group-hover:bg-indigo-600/20 group-hover:text-indigo-400'
                }`}>
                  {done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className={`font-semibold truncate transition-colors ${done ? 'text-emerald-300' : 'text-gray-200 group-hover:text-white'}`}>
                      {problem.title}
                    </span>
                    {problem.difficulty && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${diffColor}`}>
                        {problem.difficulty}
                      </span>
                    )}
                  </div>
                  {problem.tags?.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {problem.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-[11px] text-gray-500 bg-gray-800/60 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); handleSolveProblem(problem) }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all"
                  >
                    Solve
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setShowQueueModal(true) }}
                    className="p-2 rounded-lg text-xs font-medium text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 transition-all"
                    title="Practice with a partner"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors hidden sm:block" />
                </div>
              </div>
            )
          })}
        </div>

        {problems.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500 text-sm">No problems in this track yet.</p>
          </div>
        )}
      </div>

      <Modal isOpen={showQueueModal} onClose={() => setShowQueueModal(false)} title="Practice with a Partner">
        <MatchingQueue />
      </Modal>
    </div>
  )
}
