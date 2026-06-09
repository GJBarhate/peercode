import { useState, useEffect, useRef } from 'react'
import { Crown, User, Video, VideoOff, Mic, MicOff, ArrowRight, Link as LinkIcon, Check, Share2 } from 'lucide-react'
import Spinner from '../common/Spinner'
import ShareRoomModal from './ShareRoomModal'

export default function RoomLobby({ roomId, onJoin, isLoading, error = null }) {
  const [role, setRole] = useState('interviewee')
  const [localStream, setLocalStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [mediaError, setMediaError] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    async function startPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        setLocalStream(stream)
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        setMediaError('Camera/mic access denied. You can still join without video.')
        setIsVideoOff(true)
        setIsMuted(true)
      }
    }
    startPreview()
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [])

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  const toggleMute = () => {
    if (streamRef.current) {
      const newMuteState = !isMuted
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !newMuteState })
      setIsMuted(newMuteState)
    }
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      const newVideoState = !isVideoOff
      streamRef.current.getVideoTracks().forEach(t => { t.enabled = !newVideoState })
      setIsVideoOff(newVideoState)
    }
  }

  const copyRoomLink = async () => {
    try {
      // Use window.location.origin for production, fallback to full URL construction
      const baseUrl = window.location.origin || `${window.location.protocol}//${window.location.host}`
      const shareUrl = `${baseUrl}/room/${roomId}`
      
      // Try clipboard API first
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
        return
      }
      
      // Fallback: copy to temporary element
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      textarea.style.position = 'fixed'
      textarea.style.left = '0'
      textarea.style.top = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      
      if (success) {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      } else {
        throw new Error('Copy failed')
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      // Show alert with the URL
      const baseUrl = window.location.origin || `${window.location.protocol}//${window.location.host}`
      const shareUrl = `${baseUrl}/room/${roomId}`
      alert(`Share this link:\n\n${shareUrl}`)
    }
  }

  const handleJoin = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    onJoin({ role, isMuted, isVideoOff })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Ready to practice?</h1>
          <p className="text-gray-400">Configure your setup before joining the room</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-gray-200">Camera Preview</h2>
            <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
              {!isVideoOff && localStream ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="w-16 h-16 bg-indigo-800 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
              )}
              {mediaError && (
                <div className="absolute inset-x-0 bottom-0 bg-amber-900/80 text-amber-200 text-xs p-2 text-center">
                  {mediaError}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={toggleMute}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  isMuted
                    ? 'bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/40'
                    : 'bg-sky-900/20 border-sky-700/40 text-sky-400 hover:bg-sky-900/30 hover:border-sky-600/60 shadow-sm shadow-sky-500/10'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={toggleVideo}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  isVideoOff
                    ? 'bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/40'
                    : 'bg-sky-900/20 border-sky-700/40 text-sky-400 hover:bg-sky-900/30 hover:border-sky-600/60 shadow-sm shadow-sky-500/10'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                {isVideoOff ? 'Start Video' : 'Stop Video'}
              </button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-gray-200">Your Role</h2>
            <div className="space-y-3">
              {[
                { value: 'interviewer', label: 'Interviewer', desc: 'Ask questions, control the timer, take notes', icon: Crown, color: 'amber' },
                { value: 'interviewee', label: 'Interviewee', desc: 'Solve problems, explain your thinking', icon: User, color: 'indigo' }
              ].map(({ value, label, desc, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setRole(value)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                    role === value
                      ? color === 'amber' ? 'bg-amber-900/20 border-amber-700' : 'bg-indigo-900/20 border-indigo-700'
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    role === value ? (color === 'amber' ? 'bg-amber-700' : 'bg-indigo-700') : 'bg-gray-700'
                  }`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-200 text-sm">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 ${
                    role === value ? 'bg-indigo-500 border-indigo-400' : 'border-gray-600'
                  }`} />
                </button>
              ))}
            </div>

            <div className="pt-2 space-y-3">
              {error && (
                <div className="rounded-xl border border-red-700/50 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}
              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
              >
                {isLoading ? <Spinner size="sm" /> : <ArrowRight className="w-4 h-4" />}
                {isLoading ? 'Joining...' : 'Join Room'}
              </button>
              <div className="flex gap-2 justify-center pt-1">
                <button
                  onClick={copyRoomLink}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {linkCopied ? <Check className="w-3 h-3 text-green-400" /> : <LinkIcon className="w-3 h-3" />}
                  {linkCopied ? 'Copied!' : 'Copy link'}
                </button>
                <span className="text-gray-700">·</span>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  Share invite
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShareRoomModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} roomId={roomId} />
    </div>
  )
}
