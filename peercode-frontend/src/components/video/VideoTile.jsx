import { useEffect, useRef } from 'react'
import { MicOff, VideoOff } from 'lucide-react'

const AVATAR_COLORS = [
 'from-indigo-600 to-indigo-800',
 'from-emerald-600 to-emerald-800',
 'from-amber-600 to-amber-800',
 'from-rose-600 to-rose-800',
 'from-cyan-600 to-cyan-800',
 'from-purple-600 to-purple-800',
 'from-orange-600 to-orange-800',
 'from-teal-600 to-teal-800',
]

function getAvatarColor(name) {
 let hash = 0
 for (let i = 0; i < (name || '').length; i++) {
 hash = name.charCodeAt(i) + ((hash << 5) - hash)
 }
 return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function VideoTile({ stream, username, isLocal = false, isMuted = false, isVideoOff = false, size = 'md' }) {
 const videoRef = useRef(null)

 useEffect(() => {
 const video = videoRef.current
 if (video && stream) {
 video.srcObject = stream
 }
 return () => {
 if (video) video.srcObject = null
 }
 }, [stream])

 const sizes = {
 sm: 'w-32 h-24',
 md: 'w-48 h-36',
 lg: 'w-full h-full'
 }

 const avatarSizes = {
 sm: 'w-10 h-10 text-sm',
 md: 'w-12 h-12 text-base',
 lg: 'w-16 h-16 text-xl'
 }

 const initial = username?.[0]?.toUpperCase() || '?'
 const colorCls = getAvatarColor(username)

 return (
 <div className={`relative bg-bg-elevated rounded-xl overflow-hidden border border-border-strong/50 ${sizes[size]}`}>
 {stream && !isVideoOff ? (
 <video
 ref={videoRef}
 autoPlay
 playsInline
 muted={isLocal}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-gray-900 to-gray-800">
 <div className={`${avatarSizes[size]} bg-gradient-to-br ${colorCls} rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/10`}>
 <span className="font-bold text-white">{initial}</span>
 </div>
 </div>
 )}
 <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
 <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-medium truncate max-w-[75%]">
 {username}{isLocal ? ' (You)' : ''}
 </span>
 <div className="flex items-center gap-0.5">
 {isMuted && (
 <div className="bg-red-600/90 p-0.5 rounded">
 <MicOff className="w-2.5 h-2.5 text-white" />
 </div>
 )}
 {isVideoOff && (
 <div className="bg-red-600/90 p-0.5 rounded">
 <VideoOff className="w-2.5 h-2.5 text-white" />
 </div>
 )}
 </div>
 </div>
 </div>
 )
}
