import { useState, useEffect, useRef } from 'react'
import VideoTile from './VideoTile'
import VideoControls from './VideoControls'

export default function VideoPanel({
  roomId,
  socket,
  username,
  localStream = null,
  remoteStreams = {},
  onEndCall,
}) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const streamRef = useRef(localStream)

  useEffect(() => {
    streamRef.current = localStream

    const audioEnabled = localStream?.getAudioTracks().some((track) => track.enabled) ?? false
    const videoEnabled = localStream?.getVideoTracks().some((track) => track.enabled) ?? false

    setIsMuted(localStream ? !audioEnabled : true)
    setIsVideoOff(localStream ? !videoEnabled : true)
  }, [localStream])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.key === 'm' || e.key === 'M') && streamRef.current) {
        e.preventDefault()
        toggleMute()
      }
      if ((e.key === 'v' || e.key === 'V') && streamRef.current) {
        e.preventDefault()
        toggleVideo()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isMuted, isVideoOff])

  const toggleMute = () => {
    if (!streamRef.current) return
    const nextMuted = !isMuted
    streamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted
    })
    setIsMuted(nextMuted)
  }

  const toggleVideo = () => {
    if (!streamRef.current) return
    const nextVideoOff = !isVideoOff
    streamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !nextVideoOff
    })
    setIsVideoOff(nextVideoOff)
  }

  const handleHangUp = () => {
    if (socket) {
      socket.emit('leave-room', roomId)
    }
    onEndCall?.()
  }

  const remoteEntries = Object.entries(remoteStreams)

  return (
    <div className="relative h-full bg-gray-950">
      <div className="h-full flex flex-wrap gap-2 items-center justify-center overflow-hidden p-2">
        <VideoTile
          stream={localStream}
          username={username || 'You'}
          isLocal
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          size={remoteEntries.length === 0 ? 'lg' : 'md'}
        />
        {remoteEntries.map(([id, stream]) => (
          <VideoTile
            key={id}
            stream={stream}
            username={`Peer ${id.slice(0, 4)}`}
            isMuted={false}
            isVideoOff={false}
            size="md"
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pt-8 bg-gradient-to-t from-gray-950/90 via-gray-950/50 to-transparent">
        <VideoControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onHangUp={handleHangUp}
        />
      </div>
    </div>
  )
}
