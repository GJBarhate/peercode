import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Play, ExternalLink } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import ErrorState from '../components/common/ErrorState'
import PlaybackPlayer from '../components/playback/PlaybackPlayer'
import PlaybackTimeline from '../components/playback/PlaybackTimeline'
import SessionAnalytics from '../components/playback/SessionAnalytics'
import Skeleton from '../components/common/Skeleton'
import { getPlayback } from '../services/api'

export default function PlaybackPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [snapshots, setSnapshots] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('replay')

  const handleRetry = async () => {
    setError(null)
    setIsLoading(true)
    try {
      const { data } = await getPlayback(roomId)
      setSnapshots(data.snapshots || data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load playback')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const { data } = await getPlayback(roomId)
        setSnapshots(data.snapshots || data || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load playback')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [roomId])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <ErrorState
          error={error}
          title="Failed to Load Playback"
          onRetry={handleRetry}
          onGoHome={() => navigate('/dashboard')}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[500px] w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link to="/dashboard" className="btn-secondary text-sm">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-xl font-bold text-gray-100">Session Playback</h1>
          <div className="ml-auto">
            <Link
              to={`/debrief/${roomId}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View AI Debrief
            </Link>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {[
            { id: 'replay', label: 'Replay', icon: Play },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'replay' && (
          <div className="space-y-4">
            {snapshots.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
                <p className="text-gray-500">No snapshots available for this session.</p>
              </div>
            ) : (
              <>
                <div className="h-[500px]">
                  <PlaybackPlayer
                    snapshots={snapshots}
                    currentIndex={currentIndex}
                  />
                </div>
                <PlaybackTimeline
                  snapshots={snapshots}
                  currentIndex={currentIndex}
                  onChange={setCurrentIndex}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <SessionAnalytics roomId={roomId} />
        )}
      </div>
    </div>
  )
}
