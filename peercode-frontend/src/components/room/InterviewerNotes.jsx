import { useState, useEffect, useRef } from 'react'
import { StickyNote, X, Star, Copy, Check, ChevronRight } from 'lucide-react'

export default function InterviewerNotes({ roomId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [ratings, setRatings] = useState({ communication: 0, problemSolving: 0, codeQuality: 0 })
  const [wouldHire, setWouldHire] = useState(null)
  const [copied, setCopied] = useState(false)
  const debounceRef = useRef(null)

  const STORAGE_KEY = `peercode_notes_${roomId}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setNotes(parsed.notes || '')
        setRatings(parsed.ratings || { communication: 0, problemSolving: 0, codeQuality: 0 })
        setWouldHire(parsed.wouldHire ?? null)
      }
    } catch (_) {}
  }, [STORAGE_KEY])

  const save = (n, r, w) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes: n, ratings: r, wouldHire: w }))
      } catch (_) {}
    }, 500)
  }

  const handleNotesChange = (val) => {
    setNotes(val)
    save(val, ratings, wouldHire)
  }

  const handleRating = (category, value) => {
    const updated = { ...ratings, [category]: value }
    setRatings(updated)
    save(notes, updated, wouldHire)
  }

  const handleHire = (val) => {
    setWouldHire(val)
    save(notes, ratings, val)
  }

  const handleCopy = async () => {
    const text = `Interview Notes\n\nNotes:\n${notes}\n\nRatings:\nCommunication: ${ratings.communication}/5\nProblem Solving: ${ratings.problemSolving}/5\nCode Quality: ${ratings.codeQuality}/5\n\nWould Hire: ${wouldHire === true ? 'Yes' : wouldHire === false ? 'No' : 'Undecided'}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const StarRating = ({ category, label }) => (
    <div className="mb-3">
      <span className="text-xs text-gray-400 block mb-1">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRating(category, star)}
            className={`p-0.5 transition-colors ${star <= ratings[category] ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
          >
            <Star className="w-4 h-4" fill={star <= ratings[category] ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800 border border-gray-700 transition-colors"
      >
        <StickyNote className="w-3.5 h-3.5" />
        Notes
      </button>

      <div className={`fixed right-0 top-0 bottom-0 w-72 z-40 bg-gray-900 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-sm text-gray-200">Interviewer Notes</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Write your observations here..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 resize-none"
              rows={6}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Ratings</p>
            <StarRating category="communication" label="Communication" />
            <StarRating category="problemSolving" label="Problem Solving" />
            <StarRating category="codeQuality" label="Code Quality" />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Would Hire?</p>
            <div className="flex gap-2">
              {[
                { val: true, label: 'Yes', cls: wouldHire === true ? 'bg-green-700 text-white border-green-600' : 'bg-gray-800 text-gray-400 border-gray-700' },
                { val: null, label: 'Unsure', cls: wouldHire === null ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-800 text-gray-400 border-gray-700' },
                { val: false, label: 'No', cls: wouldHire === false ? 'bg-red-800 text-white border-red-700' : 'bg-gray-800 text-gray-400 border-gray-700' }
              ].map(({ val, label, cls }) => (
                <button
                  key={label}
                  onClick={() => handleHire(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${cls}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Notes'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
