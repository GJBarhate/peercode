import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Clock, BookOpen, Users, Trophy } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import ErrorState from '../components/common/ErrorState'
import Badge from '../components/common/Badge'
import Skeleton from '../components/common/Skeleton'
import Modal from '../components/common/Modal'
import MatchingQueue from '../components/room/MatchingQueue'
import { getTrack, getTrackProgress, getErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { createRoom } from '../services/api'
import toast from 'react-hot-toast'

export default function TrackDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [track, setTrack] = useState(null)
  const [progress, setProgress] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showQueueModal, setShowQueueModal] = useState(false)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

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

  useEffect(() => {
    load()
  }, [slug, user])

  const handlePracticeSolo = async (problem) => {
    setIsCreatingRoom(true)
    try {
      toast.loading('Creating room...')
      const { data } = await createRoom({ problemSlug: problem.slug })
      toast.success('✅ Room created!')
      navigate(`/room/${data.roomId}`)
    } catch (err) {
      toast.error('❌ ' + getErrorMessage(err, 'Failed to create room'))
    } finally {
      setIsCreatingRoom(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 pb-16 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
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
          title="Failed to Load Track"
          onRetry={load}
          onGoHome={() => navigate('/tracks')}
        />
      </div>
    )
  }

  const problems = track?.problems || []
  const completedIds = new Set(progress?.completedProblems || [])
  const completedCount = completedIds.size
  const total = problems.length
  const pct = total > 0 ? (completedCount / total) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <Link to="/tracks" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          All Tracks
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-indigo-700 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {track?.company?.[0] || track?.name?.[0] || '?'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-100">{track?.name}</h1>
              {track?.company && <p className="text-gray-500 text-sm mt-0.5">{track.company} Interview Prep</p>}
              {track?.description && <p className="text-gray-400 text-sm mt-2 leading-relaxed">{track.description}</p>}
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{total} problems</span>
                {track?.estimatedHours && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{track.estimatedHours}h estimated</span>}
              </div>
            </div>
          </div>

          {user && total > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400 font-medium">{completedCount}/{total} problems completed</span>
                <span className="text-gray-500">{Math.round(pct)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {progress?.completedAt && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-green-900/20 border border-green-800/40 rounded-xl">
              <Trophy className="w-4 h-4 text-green-400" />
              <p className="text-sm text-green-400 font-medium">
                Track completed on {new Date(progress.completedAt).toLocaleDateString()}!
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {problems.map((problem, i) => {
            const done = completedIds.has(problem._id || problem.id || problem.slug)
            return (
              <div
                key={problem._id || problem.slug || i}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-700 transition-colors"
              >
                <span className="text-sm font-bold text-gray-600 w-8 text-center flex-shrink-0">{i + 1}</span>
                <div className="flex-shrink-0">
                  {done
                    ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                    : <Circle className="w-5 h-5 text-gray-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-200 truncate">{problem.title}</span>
                    <Badge variant={problem.difficulty?.toLowerCase()}>{problem.difficulty}</Badge>
                  </div>
                  {problem.frequencyNote && (
                    <p className="text-xs text-gray-500 mt-0.5">{problem.frequencyNote}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handlePracticeSolo(problem)}
                    disabled={isCreatingRoom}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors disabled:opacity-50"
                  >
                    Practice Solo
                  </button>
                  <button
                    onClick={() => setShowQueueModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Find Partner
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        title="Find a Partner"
      >
        <MatchingQueue />
      </Modal>
    </div>
  )
}
