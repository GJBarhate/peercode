import { useState, useEffect, useRef, useCallback } from 'react'
import VideoTile from './VideoTile'
import VideoControls from './VideoControls'
import { MicOff, VideoOff, Monitor, Users, Wifi, WifiOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function isInputFocused() {
 const el = document.activeElement
 if (!el) return false
 const tag = el.tagName.toLowerCase()
 if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
 if (el.isContentEditable) return true
 if (el.closest('.monaco-editor')) return true
 return false
}

function ConnectionBadge({ state }) {
 if (!state || state === 'connected') return null
 const config = {
 connecting: { icon: Loader2, text: 'Connecting...', cls: 'bg-amber-600/90 text-amber-100', spin: true },
 reconnecting: { icon: Loader2, text: 'Reconnecting...', cls: 'bg-amber-600/90 text-amber-100', spin: true },
 new: { icon: Loader2, text: 'Setting up...', cls: 'bg-blue-600/90 text-blue-100', spin: true },
 disconnected: { icon: WifiOff, text: 'Disconnected', cls: 'bg-red-600/90 text-red-100', spin: false },
 failed: { icon: WifiOff, text: 'Connection failed', cls: 'bg-red-600/90 text-red-100', spin: false },
 }[state] || null
 if (!config) return null
 const Icon = config.icon
 return (
 <div className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.cls} backdrop-blur-sm`}>
 <Icon className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
 {config.text}
 </div>
 )
}

export default function VideoPanel({
 roomId,
 socket,
 userId,
 username,
 localStream = null,
 remoteStreams = {},
 peerMediaStates = {},
 connectionStates = {},
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
 }, [localStream, socket, roomId, userId])

 const toggleMute = useCallback(() => {
 if (!streamRef.current) return
 const audioTracks = streamRef.current.getAudioTracks()
 if (audioTracks.length === 0) {
 toast.error('No microphone available. Please check permissions.')
 return
 }
 setIsMuted(prev => {
 const nextMuted = !prev
 audioTracks.forEach((track) => { track.enabled = !nextMuted })
 if (socket && roomId) {
 socket.emit('user-mic-status', { roomId, userId, isMuted: nextMuted, isVideoOff })
 }
 return nextMuted
 })
 }, [socket, roomId, userId, isVideoOff])

 const toggleVideo = useCallback(() => {
 if (!streamRef.current) return
 const videoTracks = streamRef.current.getVideoTracks()
 if (videoTracks.length === 0) {
 toast.error('No camera available. Please check permissions.')
 return
 }
 setIsVideoOff(prev => {
 const nextVideoOff = !prev
 videoTracks.forEach((track) => { track.enabled = !nextVideoOff })
 if (socket && roomId) {
 socket.emit('user-mic-status', { roomId, userId, isMuted, isVideoOff: nextVideoOff })
 }
 return nextVideoOff
 })
 }, [socket, roomId, userId, isMuted])

 useEffect(() => {
 const handleKeyPress = (e) => {
 if (isInputFocused()) return
 if ((e.key === 'm' || e.key === 'M') && streamRef.current) { e.preventDefault(); toggleMute() }
 if ((e.key === 'v' || e.key === 'V') && streamRef.current) { e.preventDefault(); toggleVideo() }
 }
 window.addEventListener('keydown', handleKeyPress)
 return () => window.removeEventListener('keydown', handleKeyPress)
 }, [toggleMute, toggleVideo])

 const handleHangUp = () => {
 onEndCall?.()
 }

 const remoteEntries = Object.entries(remoteStreams)

 const renderRemotePeer = (peerId, peerStream) => {
 const state = peerMediaStates[peerId] || {}
 const connState = connectionStates[peerId] || 'connected'
 const name = participantMap[peerId] || `Peer ${peerId.slice(0, 6)}`
 const sharing = state.isScreenSharing
 const vKey = sharing ? 'screen' : 'camera'

 return (
 <div key={peerId} className={`relative rounded-xl overflow-hidden bg-bg-elevated border transition-colors ${sharing ? 'border-green-600/40 shadow-lg shadow-green-900/20' : 'border-border-strong'} ${remoteEntries.length === 1 ? 'absolute inset-2' : 'w-full h-full'}`}>
 <ConnectionBadge state={connState} />
 {state.isVideoOff && !sharing ? (
 <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-gray-900 to-gray-800">
 <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-indigo-900/30 ring-2 ring-indigo-500/20">
 <span className="text-2xl font-bold text-white">{name[0]?.toUpperCase() || '?'}</span>
 </div>
 <span className="text-text-secondary text-sm font-medium">{name}</span>
 <span className="text-text-muted text-xs mt-1">Camera is off</span>
 </div>
 ) : (
 <video
 key={vKey}
 ref={el => { if (el && el.srcObject !== peerStream) el.srcObject = peerStream }}
 autoPlay
 playsInline
 className={`w-full h-full ${sharing ? 'object-contain bg-bg-base' : 'object-cover'}`}
 />
 )}
 <div className="absolute bottom-3 left-3 flex items-center gap-2">
 <span className="bg-black/70 backdrop-blur-sm text-white text-sm px-2.5 py-1 rounded-lg font-medium">
 {sharing ? `${name}'s Screen` : name}
 </span>
 {!sharing && state.isMuted && (
 <div className="bg-red-600/90 backdrop-blur-sm p-1 rounded-lg"><MicOff className="w-3.5 h-3.5 text-white" /></div>
 )}
 {!sharing && state.isVideoOff && (
 <div className="bg-red-600/90 backdrop-blur-sm p-1 rounded-lg"><VideoOff className="w-3.5 h-3.5 text-white" /></div>
 )}
 </div>
 {sharing && (
 <div className="absolute top-3 left-3 bg-green-600/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
 <Monitor className="w-3.5 h-3.5" /> Screen Share
 </div>
 )}
 </div>
 )
 }

 return (
 <div className="relative h-full bg-bg-base">
 <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
 {onMaximize && (
 <button
 onClick={onMaximize}
 className="p-1.5 rounded-md bg-bg-surface/80 hover:bg-bg-overlay/80 text-text-muted hover:text-text-primary transition-all"
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
 className="p-1.5 rounded-md bg-bg-surface/80 hover:bg-bg-overlay/80 text-text-muted hover:text-text-primary transition-all"
 title="Minimize"
 >
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
 </button>
 )}
 </div>

 <div className="h-full flex flex-col">
 <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2">
 {remoteEntries.length > 0 ? (
 remoteEntries.length === 1 ? (
 renderRemotePeer(remoteEntries[0][0], remoteEntries[0][1])
 ) : (
 <div className={`absolute inset-2 grid gap-2 ${remoteEntries.length <= 2 ? 'grid-cols-1' : 'grid-cols-2'} ${remoteEntries.length > 2 ? 'grid-rows-2' : ''}`}>
 {remoteEntries.map(([id, stream]) => renderRemotePeer(id, stream))}
 </div>
 )
 ) : (
 <div className="flex flex-col items-center justify-center w-full h-full rounded-xl bg-gradient-to-b from-gray-900/60 to-gray-900/30 border border-dashed border-border-strong/50">
 <div className="relative mb-4">
 <div className="w-14 h-14 rounded-full bg-bg-elevated border-2 border-border-strong flex items-center justify-center">
 <Users className="w-7 h-7 text-text-muted" />
 </div>
 <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-bg-elevated border-2 border-border-strong flex items-center justify-center">
 <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
 </div>
 </div>
 <p className="text-text-muted text-sm font-medium">Waiting for partner...</p>
 <p className="text-text-muted text-xs mt-1.5">Share the room link to invite someone</p>
 </div>
 )}
 </div>

 {localStream && (
 <div className="absolute bottom-16 right-3 z-10 w-32 h-24 rounded-xl overflow-hidden border-2 border-border-strong/50 shadow-xl bg-bg-elevated transition-transform hover:scale-105">
 <VideoTile
 stream={isScreenSharing ? null : localStream}
 username={username || 'You'}
 isLocal
 isMuted={isMuted}
 isVideoOff={isVideoOff || isScreenSharing}
 size="sm"
 />
 {isScreenSharing && (
 <div className="absolute top-1 left-1 bg-green-600/90 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
 <Monitor className="w-2.5 h-2.5" /> Sharing
 </div>
 )}
 </div>
 )}
 </div>

 <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pt-8 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent">
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
