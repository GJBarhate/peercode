import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from 'lucide-react'

export default function VideoControls({ isMuted, isVideoOff, isSharing, onToggleMute, onToggleVideo, onHangUp, onScreenShare }) {
  const btnBase = 'p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 shadow-lg'
  return (
    <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900 rounded-2xl border border-gray-800 shadow-xl shadow-black/20" role="toolbar" aria-label="Video controls">
      <button
        onClick={onToggleMute}
        className={`${btnBase} ${
          isMuted
            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 focus:ring-red-500'
            : 'bg-gray-800 hover:bg-sky-500 text-gray-300 hover:text-white shadow-gray-800/50 focus:ring-sky-400'
        }`}
        title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        aria-pressed={isMuted}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      <button
        onClick={onToggleVideo}
        className={`${btnBase} ${
          isVideoOff
            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 focus:ring-red-500'
            : 'bg-gray-800 hover:bg-sky-500 text-gray-300 hover:text-white shadow-gray-800/50 focus:ring-sky-400'
        }`}
        title={isVideoOff ? 'Turn on camera (V)' : 'Turn off camera (V)'}
        aria-label={isVideoOff ? 'Enable camera' : 'Disable camera'}
        aria-pressed={isVideoOff}
      >
        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </button>

      {onScreenShare && (
        <button
          onClick={onScreenShare}
          className={`${btnBase} ${
            isSharing
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/30 focus:ring-green-500'
              : 'bg-gray-800 hover:bg-sky-500 text-gray-300 hover:text-white shadow-gray-800/50 focus:ring-sky-400'
          }`}
          title={isSharing ? 'Stop sharing screen' : 'Share screen'}
          aria-label={isSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <Monitor className="w-5 h-5" />
        </button>
      )}

      <div className="w-px h-8 bg-gray-700/50" aria-hidden="true" />

      <button
        onClick={onHangUp}
        className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-950 active:scale-95"
        title="End call (Ctrl+Shift+E)"
        aria-label="End call"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  )
}
