import { useState, useEffect, useRef } from 'react'
import VideoTile from './VideoTile'
import VideoControls from './VideoControls'
import { MicOff, VideoOff, Monitor, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VideoPanel({
  roomId,
  socket,
  userId,
  username,
  localStream = null,
  remoteStreams = {},
  peerMediaStates = {},
  participants = [],
  isScreenSharing = false,
  isMaximized = false,
  onEndCall,
  onMinimize,
  onMaximize,
  onScreenShare,
  onStopScreenShare,
}) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const streamRef = useRef(localStream)
  const videoRef = useRef(null)

  const participantMap = {}
  participants.forEach(p => {
    if (p.socketId) participantMap[p.socketId] = p.username || p.user?.username
  })

  useEffect(() => {
    streamRef.current = localStream
    if (localStream) {
      const audioEnabled = localStream.getAudioTracks().some((track) => track.enabled)
      const videoEnabled = localStream.getVideoTracks().some((track) => track.enabled)
      const muted = !audioEnabled
      const videoOff = !videoEnabled
      setIsMuted(muted)
      setIsVideoOff(videoOff)
      if (socket && roomId) {
        socket.emit('user-mic-status', { roomId, userId, isMuted: muted, isVideoOff: videoOff })
      }
    } else {
      setIsMuted(true)
      setIsVideoOff(true)
    }
  }, [localStream])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.key === 'm' || e.key === 'M') && streamRef.current) { e.preventDefault(); toggleMute() }
      if ((e.key === 'v' || e.key === 'V') && streamRef.current) { e.preventDefault(); toggleVideo() }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isMuted, isVideoOff])

  const toggleMute = () => {
    if (!streamRef.current) return
    const audioTracks = streamRef.current.getAudioTracks()
    if (audioTracks.length === 0) {
      toast.error('No microphone available. Please check permissions.')
      return
    }
    const nextMuted = !isMuted
    audioTracks.forEach((track) => { track.enabled = !nextMuted })
    setIsMuted(nextMuted)
    if (socket && roomId) {
      socket.emit('user-mic-status', { roomId, userId, isMuted: nextMuted, isVideoOff })
    }
  }

  const toggleVideo = () => {
    if (!streamRef.current) return
    const videoTracks = streamRef.current.getVideoTracks()
    if (videoTracks.length === 0) {
      toast.error('No camera available. Please check permissions.')
      return
    }
    const nextVideoOff = !isVideoOff
    videoTracks.forEach((track) => { track.enabled = !nextVideoOff })
    setIsVideoOff(nextVideoOff)
    if (socket && roomId) {
      socket.emit('user-mic-status', { roomId, userId, isMuted, isVideoOff: nextVideoOff })
    }
  }

  const handleHangUp = () => {
    if (socket) socket.emit('leave-room', roomId)
    onEndCall?.()
  }

  const remoteEntries = Object.entries(remoteStreams)
  const remoteId = remoteEntries[0]?.[0]
  const remoteStream = remoteEntries[0]?.[1]
  const remoteState = remoteId ? (peerMediaStates[remoteId] || {}) : {}
  const remoteName = remoteId ? (participantMap[remoteId] || `Peer ${remoteId.slice(0, 4)}`) : ''
  const isRemoteSharing = remoteState.isScreenSharing

  // Force video element re-mount when screen share state changes
  // so it picks up the replaced track content from remoteStream
  const videoKey = isRemoteSharing ? 'screen' : 'camera'

  return (
    <div className="relative h-full bg-gray-950">
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        {onMaximize && (
          <button
            onClick={onMaximize}
            className="p-1.5 rounded-md bg-gray-900/80 hover:bg-gray-700/80 text-gray-400 hover:text-gray-200 transition-all"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m0 0h18M3 3h3a2 2 0 012-2M3 8v13m18-13V3m0 0h-3a2 2 0 01-2-2m0 0v13" /></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            )}
          </button>
        )}
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="p-1.5 rounded-md bg-gray-900/80 hover:bg-gray-700/80 text-gray-400 hover:text-gray-200 transition-all"
            title="Minimize"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        )}
      </div>

      <div className="h-full flex flex-col">
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2">
          {remoteStream ? (
            <div className={`absolute inset-2 rounded-xl overflow-hidden bg-gray-800 border ${isRemoteSharing ? 'border-green-600/30' : 'border-gray-700'}`}>
              {remoteState.isVideoOff && !isRemoteSharing ? (
                <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900">
                  <div className="w-16 h-16 bg-indigo-700 rounded-full flex items-center justify-center mb-3">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-gray-400 text-sm">Camera is off</span>
                </div>
              ) : (
                <video
                  key={videoKey}
                  ref={el => { if (el) el.srcObject = remoteStream; videoRef.current = el }}
                  autoPlay
                  playsInline
                  className={`w-full h-full ${isRemoteSharing ? 'object-contain bg-gray-950' : 'object-cover'}`}
                />
              )}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="bg-black/70 text-white text-sm px-2.5 py-1 rounded-lg font-medium">
                  {isRemoteSharing ? `${remoteName}'s Screen` : remoteName}
                </span>
                {!isRemoteSharing && remoteState.isMuted && (
                  <div className="bg-red-600 p-1 rounded-lg"><MicOff className="w-3.5 h-3.5 text-white" /></div>
                )}
                {!isRemoteSharing && remoteState.isVideoOff && (
                  <div className="bg-red-600 p-1 rounded-lg"><VideoOff className="w-3.5 h-3.5 text-white" /></div>
                )}
              </div>
              {isRemoteSharing && (
                <div className="absolute top-3 left-3 bg-green-600 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5" /> Screen Share
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full rounded-xl bg-gray-900/50 border border-dashed border-gray-700">
              <Users className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-500 text-sm font-medium">Waiting for partner to join...</p>
              <p className="text-gray-600 text-xs mt-1">Remote video will appear here</p>
            </div>
          )}
        </div>

        {localStream && (
          <div className="absolute bottom-16 right-3 z-10 w-32 h-24 rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl bg-gray-800">
            <VideoTile
              stream={isScreenSharing ? null : localStream}
              username={username || 'You'}
              isLocal
              isMuted={isMuted}
              isVideoOff={isVideoOff || isScreenSharing}
              size="sm"
            />
            {isScreenSharing && (
              <div className="absolute top-1 left-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                <Monitor className="w-2.5 h-2.5" /> Sharing
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pt-8 bg-gradient-to-t from-gray-950/90 via-gray-950/50 to-transparent">
        <VideoControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isSharing={isScreenSharing}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onHangUp={handleHangUp}
          onScreenShare={isScreenSharing ? onStopScreenShare : onScreenShare}
        />
      </div>
    </div>
  )
}
