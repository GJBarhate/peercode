import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ErrorBoundary from '../components/common/ErrorBoundary'
import ErrorState from '../components/common/ErrorState'
import RoomLobby from '../components/room/RoomLobby'
import RoomLayout from '../components/room/RoomLayout'
import Spinner from '../components/common/Spinner'
import KeyboardShortcutsCheatSheet from '../components/common/KeyboardShortcutsCheatSheet'
import { useSocket } from '../context/SocketContext'
import { useWebRTC } from '../hooks/useWebRTC'
import { useYjsEditor } from '../hooks/useYjsEditor'
import { useRoom } from '../hooks/useRoom'
import { createRoom, getErrorMessage, joinRoom } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Lightbulb } from 'lucide-react'

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [phase, setPhase] = useState('lobby')
  const [userRole, setUserRole] = useState('interviewee')
  const [localStream, setLocalStream] = useState(null)
  const [isJoining, setIsJoining] = useState(false)
  const [resolvedRoomId, setResolvedRoomId] = useState(roomId !== 'new' ? roomId : null)
  const [socketError, setSocketError] = useState(null)
  const [isEnding, setIsEnding] = useState(false)
  const editorRef = useRef(null)
  const stuckShownRef = useRef(false)
  const hasJoinedRef = useRef(false)

  useEffect(() => {
    if (roomId !== 'new') {
      setResolvedRoomId(roomId)
    }
  }, [roomId])

  useEffect(() => {
    if (!socket || !resolvedRoomId) return

    const handleRoomEnded = () => {
      toast.dismiss()
      toast('Session has ended', { duration: 2000 })
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 2000)
    }

    const handleRoomError = (payload) => {
      const message = payload?.error || payload?.message || 'Room connection failed'
      localStream?.getTracks().forEach(track => track.stop())
      setLocalStream(null)
      setSocketError(message)
      setPhase('lobby')
      toast.error(message)
      hasJoinedRef.current = false
    }

    socket.on('room-ended', handleRoomEnded)
    socket.on('room-error', handleRoomError)

    return () => {
      socket.off('room-ended', handleRoomEnded)
      socket.off('room-error', handleRoomError)
    }
  }, [socket, resolvedRoomId, navigate, localStream])

  useEffect(() => {
    if (!isConnected && phase === 'room') {
      setSocketError('Connection lost. Reconnecting...')
    } else if (isConnected) {
      setSocketError(null)
    }
  }, [isConnected, phase])

  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(track => track.stop())
    }
  }, [localStream])

  const handleEndCall = useCallback(async () => {
    setIsEnding(true)
    try {
      if (socket) {
        socket.emit('end-call', { roomId: resolvedRoomId })
      }

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }

      toast.success('Session ended')
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 500)
    } catch (err) {
      toast.error('Failed to end session')
      setIsEnding(false)
    }
  }, [socket, resolvedRoomId, localStream, navigate])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '?' && phase === 'room') {
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'E' && phase === 'room') {
        e.preventDefault()
        handleEndCall()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [phase, handleEndCall])

  useEffect(() => {
    if (roomId === 'new') {
      createRoom({})
        .then(({ data }) => {
          const newId = data.roomId
          if (!newId) {
            throw new Error('Room creation response did not include roomId')
          }
          setResolvedRoomId(newId)
          navigate(`/room/${newId}`, { replace: true })
        })
        .catch(err => {
          toast.error(getErrorMessage(err, 'Failed to create room'))
          navigate('/dashboard', { replace: true })
        })
    }
  }, [roomId, navigate])

  const {
    room,
    participants,
    isLoading: roomLoading,
    error: roomLoadError,
  } = useRoom(resolvedRoomId, socket)

  const onStuckDetected = useCallback(() => {
    if (stuckShownRef.current) return
    stuckShownRef.current = true
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Stuck?</p>
            <p className="text-xs text-gray-400">No edits in 3 minutes</p>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t.id)
            }}
            className="ml-auto px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
          >
            Get Hint
          </button>
        </div>
      ),
      { duration: 10000, icon: null }
    )
  }, [])

  const { language, setLanguage, bindToMonaco } = useYjsEditor(resolvedRoomId, socket, editorRef, onStuckDetected)
  const { remoteStreams } = useWebRTC(resolvedRoomId, socket, localStream)

  const handleJoin = async ({ role, isMuted, isVideoOff }) => {
    if (!resolvedRoomId) return
    if (hasJoinedRef.current) {
      return
    }

    if (!socket) {
      toast.error('Waiting for connection...')
      return
    }

    hasJoinedRef.current = true
    setIsJoining(true)
    setSocketError(null)

    try {
      let stream = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: !isVideoOff,
          audio: !isMuted
        })

        stream.getAudioTracks().forEach(track => {
          track.enabled = !isMuted
        })
        stream.getVideoTracks().forEach(track => {
          track.enabled = !isVideoOff
        })
      } catch (_) {
        stream = null
      }

      setLocalStream(stream)
      setUserRole(role)
      const { data } = await joinRoom(resolvedRoomId, { role })
      const canonicalRoomId = data.roomId || resolvedRoomId
      setResolvedRoomId(canonicalRoomId)
      if (canonicalRoomId !== resolvedRoomId) {
        navigate(`/room/${canonicalRoomId}`, { replace: true })
      }
      socket.emit('join-room', { roomId: canonicalRoomId, role, username: user?.username })
      setPhase('room')
    } catch (err) {
      hasJoinedRef.current = false
      const message = getErrorMessage(err, 'Failed to join room')
      setSocketError(message)
      toast.error(message)
    } finally {
      setIsJoining(false)
    }
  }

  if (roomLoadError) {
    return (
      <ErrorState
        error={roomLoadError}
        title="Failed to Load Room"
        onRetry={() => window.location.reload()}
        onGoHome={() => navigate('/dashboard')}
      />
    )
  }

  if (roomId === 'new' && !resolvedRoomId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="xl" />
          <p className="text-gray-400">Creating room...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {phase === 'lobby' ? (
        <RoomLobby
          roomId={resolvedRoomId}
          onJoin={handleJoin}
          isLoading={isJoining || roomLoading}
          error={socketError}
        />
      ) : (
        <RoomLayout
          roomId={resolvedRoomId}
          room={room}
          participants={participants}
          socket={socket}
          localStream={localStream}
          remoteStreams={remoteStreams}
          language={language}
          setLanguage={setLanguage}
          editorRef={editorRef}
          bindToMonaco={bindToMonaco}
          userRole={userRole}
          onEndCall={handleEndCall}
          isEnding={isEnding}
        />
      )}
      {phase === 'room' && <KeyboardShortcutsCheatSheet />}
    </ErrorBoundary>
  )
}
