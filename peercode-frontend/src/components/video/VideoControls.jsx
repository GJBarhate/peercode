import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from 'lucide-react'

export default function VideoControls({ isMuted, isVideoOff, onToggleMute, onToggleVideo, onHangUp, onScreenShare }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-2xl border border-gray-800" role="toolbar" aria-label="Video controls">
      <button
        onClick={onToggleMute}
        className={`p-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 ${
          isMuted
            ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white focus:ring-indigo-500'
        }`}
        title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        aria-pressed={isMuted}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 ${
          isVideoOff
            ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white focus:ring-indigo-500'
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
          className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950"
          title="Share screen"
          aria-label="Share screen"
        >
          <Monitor className="w-5 h-5" />
        </button>
      )}

      <div className="w-px h-8 bg-gray-700" aria-hidden="true" />

      <button
        onClick={onHangUp}
        className="p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-950"
        title="End call (Ctrl+Shift+E)"
        aria-label="End call"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  )
}
