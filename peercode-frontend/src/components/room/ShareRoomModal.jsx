import { useState } from 'react'
import { Copy, Check, Share2, MessageCircle } from 'lucide-react'
import Modal from '../common/Modal'
import toast from 'react-hot-toast'

export default function ShareRoomModal({ isOpen, onClose, roomId }) {
  const [copied, setCopied] = useState(false)

  if (!roomId) return null

  const shareUrl = `${window.location.origin}/room/${roomId}`

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast.success('Link copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopied(true)
        toast.success('Link copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Copy failed:', err)
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my PeerCode Session',
          text: 'Let\'s practice coding together!',
          url: shareUrl,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err)
          toast.error('Failed to share')
        }
      }
    } else {
      // Fallback to copy
      handleCopyLink()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Room">
      <div className="space-y-4 p-6">
        {/* Link Display */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Room Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
              aria-label="Copy link"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Room ID */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Room ID
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={roomId}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomId)
                toast.success('Room ID copied!')
              }}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-300 transition-colors"
              title="Copy room ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-indigo-900/20 border border-indigo-700/50 rounded-lg p-3">
          <p className="text-sm text-indigo-300 flex items-start gap-2">
            <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Share this link with your partner to join the room</span>
          </p>
        </div>

        {/* Share Button (if available) */}
        {navigator.share && (
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share via...
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors"
        >
          Done
        </button>
      </div>
    </Modal>
  )
}
