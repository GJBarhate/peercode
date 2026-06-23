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
 return () => {
 if (debounceRef.current) clearTimeout(debounceRef.current)
 }
 }, [])

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
 <span className="text-xs text-text-muted block mb-1">{label}</span>
 <div className="flex gap-1">
 {[1, 2, 3, 4, 5].map(star => (
 <button
 key={star}
 onClick={() => handleRating(category, star)}
 className={`p-0.5 transition-colors ${star <= ratings[category] ? 'text-amber-400' : 'text-text-muted hover:text-text-secondary'}`}
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
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-border-strong transition-colors"
 >
 <StickyNote className="w-3.5 h-3.5" />
 Notes
 </button>

 <div className={`fixed right-0 top-0 bottom-0 w-72 z-40 bg-bg-surface border-l border-border-strong shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
 <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
 <div className="flex items-center gap-2">
 <StickyNote className="w-4 h-4 text-indigo-400" />
 <span className="font-semibold text-sm text-text-primary">Interviewer Notes</span>
 </div>
 <button
 onClick={() => setIsOpen(false)}
 className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 <div>
 <label className="text-xs font-medium text-text-muted block mb-1.5">Notes</label>
 <textarea
 value={notes}
 onChange={e => handleNotesChange(e.target.value)}
 placeholder="Write your observations here..."
 className="w-full bg-bg-elevated border border-border-strong text-text-primary rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-text-muted resize-none"
 rows={6}
 />
 </div>

 <div>
 <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider">Ratings</p>
 <StarRating category="communication" label="Communication" />
 <StarRating category="problemSolving" label="Problem Solving" />
 <StarRating category="codeQuality" label="Code Quality" />
 </div>

 <div>
 <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Would Hire?</p>
 <div className="flex gap-2">
 {[
 { val: true, label: 'Yes', cls: wouldHire === true ? 'bg-green-700 text-white border-green-600' : 'bg-bg-elevated text-text-muted border-border-strong' },
 { val: null, label: 'Unsure', cls: wouldHire === null ? 'bg-bg-overlay text-white border-border-strong' : 'bg-bg-elevated text-text-muted border-border-strong' },
 { val: false, label: 'No', cls: wouldHire === false ? 'bg-red-800 text-white border-red-700' : 'bg-bg-elevated text-text-muted border-border-strong' }
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

 <div className="p-4 border-t border-border-default">
 <button
 onClick={handleCopy}
 className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-bg-elevated hover:bg-bg-overlay text-text-secondary hover:text-white border border-border-strong transition-colors"
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
