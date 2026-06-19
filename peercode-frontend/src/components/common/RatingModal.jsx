import { useState } from 'react'
import { Star, MessageSquare, X } from 'lucide-react'
import { submitRating, getErrorMessage } from '../../services/api'
import toast from 'react-hot-toast'

export default function RatingModal({ isOpen, onClose, sessionId, partnerName, partnerId }) {
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [hovered, setHovered] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (score === 0) { toast.error('Please select a rating'); return }
    setSubmitting(true)
    try {
      await submitRating(sessionId, partnerId, score, feedback)
      toast.success('Rating submitted! Thank you for your feedback.')
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit rating'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 id="rating-modal-title" className="text-lg font-bold text-gray-100">Rate Your Partner</h3>
          <button onClick={onClose} aria-label="Close rating modal" className="p-1 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {partnerName && (
          <p className="text-sm text-gray-400 mb-4">
            How was your session with <span className="font-semibold text-gray-200">{partnerName}</span>?
          </p>
        )}

        {/* Star Rating */}
        <div className="flex justify-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              aria-label={`Rate ${star} out of 5`}
              aria-pressed={score === star}
              onClick={() => setScore(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="p-1 transition-all hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hovered || score) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>

        {score > 0 && (
          <p className="text-center text-xs text-gray-500 mb-4">
            {score === 1 ? 'Poor' : score === 2 ? 'Fair' : score === 3 ? 'Good' : score === 4 ? 'Very Good' : 'Excellent'}
          </p>
        )}

        {/* Feedback */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> Feedback (optional)
          </label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value.slice(0, 500))}
            placeholder="Share your thoughts about the session..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{feedback.length}/500</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || score === 0}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all"
        >
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>
    </div>
  )
}
