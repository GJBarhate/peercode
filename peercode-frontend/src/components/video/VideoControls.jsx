import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor } from 'lucide-react'

export default function VideoControls({ isMuted, isVideoOff, isSharing, onToggleMute, onToggleVideo, onHangUp, onScreenShare }) {
 const btnBase = 'p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-950 shadow-lg active:scale-95'
 return (
 <div className="flex items-center gap-2 p-1.5 bg-bg-surface/95 backdrop-blur-md rounded-2xl border border-border-default/80 shadow-xl shadow-black/30" role="toolbar" aria-label="Video controls">
 <button
 onClick={onToggleMute}
 className={`${btnBase} ${
 isMuted
 ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 focus:ring-red-500'
 : 'bg-bg-elevated hover:bg-bg-overlay text-text-secondary hover:text-white shadow-gray-800/50 focus:ring-indigo-400'
 }`}
 title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
 aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
 aria-pressed={isMuted}
 >
 {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
 </button>

 <button
 onClick={onToggleVideo}
 className={`${btnBase} ${
 isVideoOff
 ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 focus:ring-red-500'
 : 'bg-bg-elevated hover:bg-bg-overlay text-text-secondary hover:text-white shadow-gray-800/50 focus:ring-indigo-400'
 }`}
 title={isVideoOff ? 'Turn on camera (V)' : 'Turn off camera (V)'}
 aria-label={isVideoOff ? 'Enable camera' : 'Disable camera'}
 aria-pressed={isVideoOff}
 >
 {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
 </button>

 {onScreenShare && (
 <button
 onClick={onScreenShare}
 className={`${btnBase} flex items-center gap-1.5 ${
 isSharing
 ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/30 focus:ring-green-500'
 : 'bg-bg-elevated hover:bg-bg-overlay text-text-secondary hover:text-white shadow-gray-800/50 focus:ring-indigo-400'
 }`}
 title={isSharing ? 'Stop sharing screen' : 'Share screen'}
 aria-label={isSharing ? 'Stop sharing screen' : 'Share screen'}
 aria-pressed={isSharing}
 >
 <Monitor className="w-4 h-4" />
 {isSharing && <span className="text-[11px] font-semibold">Stop</span>}
 </button>
 )}

 <div className="w-px h-7 bg-bg-overlay/50 mx-0.5" aria-hidden="true" />

 <button
 onClick={onHangUp}
 className="p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-gray-950 active:scale-95"
 title="End call (Ctrl+Shift+E)"
 aria-label="End call"
 >
 <PhoneOff className="w-4 h-4" />
 </button>
 </div>
 )
}
