import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Clock, ChevronRight, CheckCircle2, Target, Sparkles, BarChart3, Search, TrendingUp } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import ErrorState from '../components/common/ErrorState'
import Skeleton from '../components/common/Skeleton'
import CompanyLogo from '../components/common/CompanyLogo'
import { NoTracksIllustration } from '../components/common/EmptyStateIllustrations'
import { getTracks, getAllTracksProgress, getTrackProgress } from '../services/api'
import { useAuth } from '../context/AuthContext'

const COMPANY_GRADIENTS = {
  Amazon: 'from-amber-600/20 to-amber-800/10 border-amber-700/20 hover:border-amber-600/40',
  Google: 'from-blue-600/20 to-blue-800/10 border-blue-700/20 hover:border-blue-600/40',
  Meta: 'from-blue-600/20 to-indigo-800/10 border-blue-700/20 hover:border-blue-600/40',
  Apple: 'from-gray-600/20 to-gray-800/10 border-gray-700/20 hover:border-gray-600/40',
  Microsoft: 'from-green-600/20 to-green-800/10 border-green-700/20 hover:border-green-600/40',
  Netflix: 'from-red-600/20 to-red-800/10 border-red-700/20 hover:border-red-600/40',
  Uber: 'from-gray-600/20 to-gray-800/10 border-gray-700/20 hover:border-gray-600/40',
  default: 'from-sky-600/20 to-sky-800/10 border-sky-700/20 hover:border-sky-600/40',
}

const DIFF_COLORS = { easy: 'bg-emerald-500', medium: 'bg-amber-500', hard: 'bg-red-500' }

export default function TracksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tracks, setTracks] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await getTracks()
      const trackList = data.tracks || data || []
      setTracks(trackList)
      if (user) {
        try {
          const { data: progressData } = await getAllTracksProgress()
          const map = {}
          const list = Array.isArray(progressData) ? progressData : []
          for (const item of list) { map[item.slug] = item }
          setProgressMap(map)
        } catch {
          const results = await Promise.allSettled(trackList.map(t => getTrackProgress(t.slug)))
          const map = {}
          trackList.forEach((t, i) => {
            if (results[i].status === 'fulfilled') map[t.slug] = results[i].value.data
          })
          setProgressMap(map)
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tracks')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [user])

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks
    const q = searchQuery.toLowerCase()
    return tracks.filter(t => t.name?.toLowerCase().includes(q) || t.company?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
  }, [tracks, searchQuery])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
          <Skeleton className="h-10 w-48 mb-3" />
          <Skeleton className="h-5 w-80 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-56" />)}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <ErrorState error={error} title="Failed to Load Tracks" onRetry={load} onGoHome={() => navigate('/dashboard')} />
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-sky-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-sky-950/30 p-6 sm:p-8 mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-sky-400" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Learning Tracks</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-2xl">Master algorithms & data structures through structured problem sets — practice solo or paired with a partner in real-time</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-600">
              <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-sky-400" />{tracks.length} tracks available</span>
              <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-emerald-400" />{tracks.filter(t => t.company).length} company-specific</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input type="text" placeholder="Search tracks by name, company, or description..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500/50 transition-all" />
        </div>

        {filteredTracks.length === 0 ? (
          <div className="text-center py-16">
            {searchQuery ? (
              <>
                <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No tracks match your search</p>
              </>
            ) : (
              <>
                <NoTracksIllustration />
                <p className="text-gray-500 mt-4">No tracks available yet.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTracks.map((track) => {
              const gradient = COMPANY_GRADIENTS[track.company] || COMPANY_GRADIENTS.default
              const progress = progressMap[track.slug]
              const completed = progress ? (typeof progress.completedProblems === 'number' ? progress.completedProblems : (progress.completedProblems?.length || 0)) : 0
              const total = progress?.totalProblems || track.problemCount || track.problems?.length || 0
              const pct = total > 0 ? (completed / total) * 100 : 0
              const isComplete = pct >= 100

              return (
              <Link key={track._id || track.slug} to={`/tracks/${track.slug}`}
                  className={`group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 p-5 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-sky-500/10 ${gradient}`}> 
                  
                  {/* Hover shine effect */}
                  <div className="absolute -inset-full top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.02] to-transparent group-hover:translate-x-full transition-transform duration-700" />

                  <div className="relative flex items-start gap-3">
                    <CompanyLogo company={track.company} size="w-12 h-12" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors leading-tight">{track.name}</h3>
                      {track.company && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-300 dark:border-sky-500/20">
                          {track.company}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-700 group-hover:text-sky-500 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                  </div>

                  {track.description && (
                    <p className="relative text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{track.description}</p>
                  )}

                  <div className="relative flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />{total} problems</span>
                    {track.estimatedHours && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />{track.estimatedHours}h</span>}
                  </div>

                  {user && total > 0 && (
                    <div className="relative">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-gray-500 dark:text-gray-500 font-medium">{completed}/{total} <span className="text-gray-400 dark:text-gray-600">completed</span></span>
                        <span className={`font-semibold ${isComplete ? 'text-emerald-400' : 'text-sky-400'}`}>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ease-out ${isComplete ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-sky-500 to-sky-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  <div className={`relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isComplete
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 group-hover:bg-emerald-600/30'
                      : user && completed > 0
                        ? 'bg-sky-600/90 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20'
                        : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20'
                  }`}>
                    {isComplete ? <><CheckCircle2 className="w-4 h-4" /> Completed</>
                      : user && completed > 0 ? <><TrendingUp className="w-4 h-4" /> Continue <ChevronRight className="w-4 h-4" /></>
                      : <><Sparkles className="w-4 h-4" /> Start Track <ChevronRight className="w-4 h-4" /></>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
