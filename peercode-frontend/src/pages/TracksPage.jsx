import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Clock, ChevronRight, CheckCircle2 } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import ErrorState from '../components/common/ErrorState'
import Skeleton from '../components/common/Skeleton'
import { getTracks, getAllTracksProgress, getTrackProgress } from '../services/api'
import { useAuth } from '../context/AuthContext'

const COMPANY_STYLES = {
  Amazon: { bg: 'bg-amber-700', text: 'text-white', initial: 'A' },
  Google: { bg: 'bg-blue-700', text: 'text-white', initial: 'G' },
  Meta: { bg: 'bg-blue-600', text: 'text-white', initial: 'M' },
  Apple: { bg: 'bg-gray-700', text: 'text-white', initial: 'Ap' },
  Microsoft: { bg: 'bg-green-700', text: 'text-white', initial: 'Ms' },
  default: { bg: 'bg-indigo-700', text: 'text-white', initial: '?' }
}

export default function TracksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tracks, setTracks] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

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
          for (const item of list) {
            map[item.slug] = item
          }
          setProgressMap(map)
        } catch {
          const progressResults = await Promise.allSettled(
            trackList.map(t => getTrackProgress(t.slug))
          )
          const map = {}
          trackList.forEach((t, i) => {
            if (progressResults[i].status === 'fulfilled') {
              map[t.slug] = progressResults[i].value.data
            }
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

  useEffect(() => {
    load()
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <ErrorState
          error={error}
          title="Failed to Load Tracks"
          onRetry={load}
          onGoHome={() => navigate('/dashboard')}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Learning Tracks</h1>
          <p className="text-gray-400">Structured problem sets to master company-specific interview patterns</p>
        </div>

        {tracks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No tracks available yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tracks.map(track => {
              const style = COMPANY_STYLES[track.company] || COMPANY_STYLES.default
              const progress = progressMap[track.slug]
              const completed = progress ? (typeof progress.completedProblems === 'number' ? progress.completedProblems : (progress.completedProblems?.length || 0)) : 0
              const total = progress?.totalProblems || track.problemCount || track.problems?.length || 0
              const pct = total > 0 ? (completed / total) * 100 : 0
              const isComplete = pct >= 100

              return (
                <div
                  key={track._id || track.slug}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 flex flex-col gap-4 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center text-sm font-bold ${style.text} flex-shrink-0`}>
                      {track.company?.[0] || style.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-100 leading-tight">{track.name}</h3>
                      {track.company && <p className="text-xs text-gray-500 mt-0.5">{track.company}</p>}
                    </div>
                  </div>

                  {track.description && (
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{track.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {total} problems
                    </span>
                    {track.estimatedHours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {track.estimatedHours}h estimated
                      </span>
                    )}
                  </div>

                  {user && total > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">{completed}/{total} completed</span>
                        <span className="text-gray-500">{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete ? 'bg-green-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/tracks/${track.slug}`}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isComplete
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isComplete ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        View Track
                      </>
                    ) : user && completed > 0 ? (
                      <>
                        Continue Track
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Start Track
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
