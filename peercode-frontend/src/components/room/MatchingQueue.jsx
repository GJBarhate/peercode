import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Loader2, CheckCircle2, X, Zap, Clock, ArrowRight } from 'lucide-react'
import { useSocket } from '../../context/SocketContext'
import toast from 'react-hot-toast'

const TOPICS = ['Arrays', 'Strings', 'Trees', 'Graphs', 'DP', 'Sorting', 'Linked Lists', 'Any']
const ROLES = [
  { value: 'interviewer', label: 'Interviewer' },
  { value: 'interviewee', label: 'Interviewee' },
  { value: 'any', label: 'Either' }
]

export default function MatchingQueue() {
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [state, setState] = useState('idle')
  const [role, setRole] = useState('any')
  const [topic, setTopic] = useState('Any')
  const [queuePosition, setQueuePosition] = useState(null)
  const [countdown, setCountdown] = useState(60)
  const [matchedRoomId, setMatchedRoomId] = useState(null)
  const [timerExpired, setTimerExpired] = useState(false)

  useEffect(() => {
    if (!socket) return

    const onMatched = (data) => {
      setMatchedRoomId(data.roomId)
      setState('matched')
      setCountdown(60)
      setTimerExpired(false)
      toast.success('Found a partner! Joining room...')
    }

    const onWaiting = ({ position, estimatedWaitSeconds }) => {
      setQueuePosition(position)
      setState('waiting')
      setCountdown(60)
      setTimerExpired(false)
      toast.loading(`In queue #${position}. Est. wait: ${Math.ceil(estimatedWaitSeconds / 60)} min`)
    }

    const onLeft = () => {
      setState('idle')
      setQueuePosition(null)
      setTimerExpired(false)
      toast.dismiss()
    }

    const onError = (error) => {
      toast.error(error.message || 'Queue error occurred')
      setState('idle')
      setTimerExpired(false)
    }

    socket.on('queue-matched', onMatched)
    socket.on('queue-waiting', onWaiting)
    socket.on('queue-left', onLeft)
    socket.on('queue-error', onError)

    return () => {
      socket.off('queue-matched', onMatched)
      socket.off('queue-waiting', onWaiting)
      socket.off('queue-left', onLeft)
      socket.off('queue-error', onError)
    }
  }, [socket])

  useEffect(() => {
    if (state === 'matched' && matchedRoomId) {
      const t = setTimeout(() => navigate(`/room/${matchedRoomId}`), 1500)
      return () => clearTimeout(t)
    }
  }, [state, matchedRoomId, navigate])

  useEffect(() => {
    if (state === 'waiting' && countdown > 0 && !timerExpired) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
    if (state === 'waiting' && countdown === 0 && !timerExpired) {
      setTimerExpired(true)
      if (socket) socket.emit('queue-leave')
      toast.dismiss()
    }
  }, [state, countdown, timerExpired, socket])

  useEffect(() => {
    return () => {
      if (state === 'waiting' && socket) {
        socket.emit('queue-leave')
      }
    }
  }, [state, socket])

  const handleJoin = () => {
    if (!socket) { toast.error('Not connected to server'); return }
    socket.emit('queue-join', { role, topic })
    setState('waiting')
    setTimerExpired(false)
  }

  const handleLeave = () => {
    if (socket) socket.emit('queue-leave')
    setState('idle')
    setQueuePosition(null)
    setTimerExpired(false)
  }

  const handleKeepWaiting = () => {
    setCountdown(60)
    setTimerExpired(false)
    if (socket) {
      socket.emit('queue-join', { role, topic })
      setState('waiting')
      toast.loading('Re-entered queue...')
    }
  }

  const handleSolo = () => {
    if (socket) socket.emit('queue-leave')
    navigate('/problems')
  }

  if (state === 'matched') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-100">Match Found!</h3>
          <p className="text-gray-400 text-sm mt-1">Redirecting to room...</p>
        </div>
      </div>
    )
  }

  if (state === 'waiting' && timerExpired) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="w-16 h-16 bg-amber-900/30 rounded-full flex items-center justify-center">
          <Clock className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-100">No partner found</h3>
          <p className="text-gray-400 text-sm mt-1">Could not find a match within 60 seconds</p>
        </div>
        <div className="flex gap-3 mt-2 w-full max-w-xs">
          <button
            onClick={handleSolo}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Start Solo Practice
          </button>
          <button
            onClick={handleKeepWaiting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
          >
            <Users className="w-4 h-4" />
            Keep Waiting
          </button>
        </div>
      </div>
    )
  }

  if (state === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping-slow" />
          <div className="relative w-16 h-16 bg-indigo-900/40 rounded-full flex items-center justify-center border border-indigo-700">
            <Users className="w-7 h-7 text-indigo-400" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-100">Finding a Partner...</h3>
          <p className="text-gray-400 text-sm mt-1">
            {queuePosition ? `Queue position: #${queuePosition}` : 'Searching...'}
          </p>
          <p className="text-gray-500 text-xs mt-1">Role: {role} • Topic: {topic}</p>
        </div>
        <div className="w-full max-w-xs bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${((60 - countdown) / 60) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 font-mono">{countdown}s remaining</p>
        <div className="flex gap-2 mt-2">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-sm text-gray-500">This may take a moment</span>
        </div>
        <button
          onClick={handleLeave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-gray-100">Quick Match</h3>
        </div>
        <p className="text-gray-500 text-xs">Get paired with another developer instantly</p>
      </div>

      <div>
        <label htmlFor="role-group" className="text-xs font-medium text-gray-400 block mb-2">Your Role</label>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="role-group" id="role-group">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              role="radio"
              aria-checked={role === r.value}
              className={`py-2 rounded-lg text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 ${
                role === r.value
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="topic-group" className="text-xs font-medium text-gray-400 block mb-2">Topic</label>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby="topic-group" id="topic-group">
          {TOPICS.map(t => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              role="radio"
              aria-checked={topic === t}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 ${
                topic === t
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleJoin}
        disabled={!socket}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Users className="w-4 h-4" />
        Find Partner
      </button>
    </div>
  )
}
