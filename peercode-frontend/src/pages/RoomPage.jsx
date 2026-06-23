import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import ErrorBoundary from '../components/common/ErrorBoundary'
import ErrorState from '../components/common/ErrorState'
import RoomLobby from '../components/room/RoomLobby'
import RoomLayout from '../components/room/RoomLayout'
import Spinner from '../components/common/Spinner'
import KeyboardShortcutsCheatSheet from '../components/common/KeyboardShortcutsCheatSheet'
import { useSocket } from '../context/SocketContext'
import { useWebRTC } from '../hooks/useWebRTC'
import { useBandwidthAdaptive } from '../hooks/useBandwidthAdaptive'
import { useYjsEditor } from '../hooks/useYjsEditor'
import { useRoom } from '../hooks/useRoom'
import { createRoom, getErrorMessage, joinRoom } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Lightbulb, Users } from 'lucide-react'

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
 const [showEndConfirm, setShowEndConfirm] = useState(false)
 const editorRef = useRef(null)
 const stuckShownRef = useRef(false)
 const hasJoinedRef = useRef(false)
 const mountedRef = useRef(true)
 const sessionStartRef = useRef(null)

 useEffect(() => {
 if (roomId !== 'new') {
 setResolvedRoomId(roomId)
 }
 }, [roomId])

 useEffect(() => {
 if (!socket || !resolvedRoomId) return

 const handleRoomEnded = () => {
 toast.dismiss()
 toast('Session has ended — loading debrief...', { duration: 2000 })
 setTimeout(() => {
 navigate(`/debrief/${resolvedRoomId}`, { replace: true })
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

  const confirmEndCall = useCallback(() => {
    setShowEndConfirm(true)
  }, [])

  const handleEndCall = useCallback(async (endData) => {
    setShowEndConfirm(false)
    setIsEnding(true)
    try {
      if (socket) {
        socket.emit('end-call', {
          roomId: resolvedRoomId,
          finalCode: endData?.finalCode,
          finalLanguage: endData?.finalLanguage,
        })
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      toast.success('Session ended — redirecting to debrief...')
      setTimeout(() => {
        navigate(`/debrief/${resolvedRoomId}`, { replace: true })
      }, 1000)
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
 confirmEndCall()
 }
 }

 window.addEventListener('keydown', handleKeyPress)
 return () => window.removeEventListener('keydown', handleKeyPress)
 }, [phase, confirmEndCall])

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

 useEffect(() => {
 mountedRef.current = true
 return () => { mountedRef.current = false }
 }, [])

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
 <p className="text-xs text-text-muted">No edits in 3 minutes</p>
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
 const { remoteStreams, peerMediaStates, connectionStates, isScreenSharing, startScreenShare, stopScreenShare, syncLocalStream, getPeers } = useWebRTC(resolvedRoomId, socket, localStream)
 const { videoQuality } = useBandwidthAdaptive(getPeers, localStream)

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
 // Always request both tracks so they can be toggled later
 stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

 if (!mountedRef.current) {
 stream.getTracks().forEach(track => track.stop())
 return
 }

 // Apply initial mute states using track.enabled
 stream.getAudioTracks().forEach(track => {
 track.enabled = !isMuted
 })
 stream.getVideoTracks().forEach(track => {
 track.enabled = !isVideoOff
 })
 } catch (err) {
 // Try video only if both failed
 try {
 stream = await navigator.mediaDevices.getUserMedia({ video: true })
 stream.getVideoTracks().forEach(track => {
 track.enabled = !isVideoOff
 })
 } catch (err2) {
 // Try audio only
 try {
 stream = await navigator.mediaDevices.getUserMedia({ audio: true })
 stream.getAudioTracks().forEach(track => {
 track.enabled = !isMuted
 })
 } catch (err3) {
 stream = null
 const isDenied = err3?.name === 'NotAllowedError' || err2?.name === 'NotAllowedError' || err?.name === 'NotAllowedError'
 toast.error(isDenied
 ? 'Microphone/camera access denied. Grant permission in browser settings to use audio & video.'
 : 'No media devices found. You will join without audio/video.',
 { duration: 8000 }
 )
 }
 }
 }

 if (!mountedRef.current) {
 if (stream) stream.getTracks().forEach(track => track.stop())
 return
 }

 syncLocalStream(stream)
 setLocalStream(stream)
 setUserRole(role)
 const { data } = await joinRoom(resolvedRoomId, { role })
 const canonicalRoomId = data.roomId || resolvedRoomId
 setResolvedRoomId(canonicalRoomId)
 if (canonicalRoomId !== resolvedRoomId) {
 navigate(`/room/${canonicalRoomId}`, { replace: true })
 }
 socket.emit('join-room', { roomId: canonicalRoomId, role, username: user?.username })
 sessionStartRef.current = Date.now()
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
 onRetry={() => navigate(0)}
 onGoHome={() => navigate('/dashboard')}
 />
 )
 }

 if (roomId === 'new' && !resolvedRoomId) {
 return (
 <div className="min-h-screen bg-bg-base flex items-center justify-center">
 <div className="flex flex-col items-center gap-4">
 <Spinner size="xl" />
 <p className="text-text-muted">Creating room...</p>
 </div>
 </div>
 )
 }

 return (
 <ErrorBoundary>
 <Helmet>
 <title>Coding Room | PeerCode</title>
 <meta name="robots" content="noindex" />
 </Helmet>
 {phase === 'lobby' ? (
 <RoomLobby
 roomId={resolvedRoomId}
 onJoin={handleJoin}
 isLoading={isJoining || roomLoading}
 error={socketError}
 />
 ) : (
 <>
 {participants.length < 2 && (
 <div className="fixed inset-0 z-50 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
 <div className="bg-bg-surface border border-border-default rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm text-center shadow-2xl">
 <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
 <Users className="w-7 h-7 text-indigo-400 animate-pulse" />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-text-primary">Waiting for peer</h3>
 <p className="mt-1 text-sm text-text-muted">Share the room link to invite someone</p>
 </div>
 <div className="w-full bg-bg-elevated rounded-lg px-4 py-2 pointer-events-auto">
 <p className="text-xs text-text-muted truncate select-all">{window.location.href}</p>
 </div>
 </div>
 </div>
 )}
 <RoomLayout
 roomId={resolvedRoomId}
 room={room}
 participants={participants}
 socket={socket}
 localStream={localStream}
 remoteStreams={remoteStreams}
 peerMediaStates={peerMediaStates}
 connectionStates={connectionStates}
 isScreenSharing={isScreenSharing}
 onScreenShare={startScreenShare}
 onStopScreenShare={stopScreenShare}
 language={language}
 setLanguage={setLanguage}
 editorRef={editorRef}
 bindToMonaco={bindToMonaco}
 userRole={userRole}
 videoQuality={videoQuality}
 onEndCall={confirmEndCall}
 isEnding={isEnding}
 />
 </>
 )}
 {phase === 'room' && <KeyboardShortcutsCheatSheet />}
 {showEndConfirm && (
 <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowEndConfirm(false)}>
 <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
 <h3 className="text-lg font-bold text-text-primary mb-2">End Session?</h3>
 <p className="text-sm text-text-muted mb-6">This will end the coding session for all participants. You'll be redirected to your AI-generated debrief with performance analysis and improvement tips.</p>
 <div className="flex gap-3">
 <button
 onClick={() => setShowEndConfirm(false)}
 className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-text-secondary bg-bg-elevated hover:bg-bg-overlay border border-border-default transition-all"
 >
 Cancel
 </button>
 <button
 onClick={() => handleEndCall()}
 disabled={isEnding}
 className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-all"
 >
 {isEnding ? 'Ending...' : 'End Session'}
 </button>
 </div>
 </div>
 </div>
 )}
 </ErrorBoundary>
 )
}
