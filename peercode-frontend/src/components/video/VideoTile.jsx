import { useEffect, useRef } from 'react'
import { MicOff, VideoOff, User } from 'lucide-react'

export default function VideoTile({ stream, username, isLocal = false, isMuted = false, isVideoOff = false, size = 'md' }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const sizes = {
    sm: 'w-32 h-24',
    md: 'w-48 h-36',
    lg: 'w-full h-full'
  }

  return (
    <div className={`relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 ${sizes[size]}`}>
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-900">
          <div className="w-12 h-12 bg-indigo-700 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded font-medium truncate max-w-[80%]">
          {username}{isLocal ? ' (You)' : ''}
        </span>
        <div className="flex items-center gap-1">
          {isMuted && (
            <div className="bg-red-600 p-0.5 rounded">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
          {isVideoOff && (
            <div className="bg-red-600 p-0.5 rounded">
              <VideoOff className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>
      {isLocal && (
        <div className="absolute top-2 left-2 bg-indigo-600/80 text-white text-xs px-1.5 py-0.5 rounded">
          You
        </div>
      )}
    </div>
  )
}
