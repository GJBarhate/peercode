import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusTrap from 'focus-trap-react'
import Fuse from 'fuse.js'
import { Search, ArrowRight, Zap, Users, BookOpen, Layers, Bot, User, Crown, LayoutDashboard, Shield, Settings } from 'lucide-react'

const COMMANDS = [
 { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, path: '/dashboard', group: 'Navigate' },
 { id: 'problems', label: 'Browse Problems', icon: BookOpen, path: '/problems', group: 'Navigate' },
 { id: 'tracks', label: 'View Tracks', icon: Layers, path: '/tracks', group: 'Navigate' },
 { id: 'partner', label: 'Find a Practice Partner', icon: Users, path: '/find-partner', group: 'Navigate' },
 { id: 'ai-interview', label: 'Start AI Interview', icon: Bot, path: '/ai-interview', group: 'Navigate' },
 { id: 'profile', label: 'My Profile', icon: User, path: '/profile', group: 'Navigate' },
 { id: 'subscription', label: 'Manage Subscription', icon: Crown, path: '/subscription', group: 'Navigate' },
 { id: 'admin', label: 'Admin Panel', icon: Shield, path: '/admin', group: 'Navigate' },
 { id: 'random', label: 'Solve Random Problem', icon: Zap, path: '/problems?random=1', group: 'Actions' },
]

const fuse = new Fuse(COMMANDS, { keys: ['label', 'group'], threshold: 0.4 })

export default function CommandPalette({ isOpen, onClose }) {
 const [query, setQuery] = useState('')
 const [selected, setSelected] = useState(0)
 const inputRef = useRef(null)
 const navigate = useNavigate()

 const results = useMemo(() => {
 if (!query.trim()) return COMMANDS
 return fuse.search(query).map(r => r.item)
 }, [query])

 useEffect(() => {
 if (isOpen) {
 setQuery('')
 setSelected(0)
 setTimeout(() => inputRef.current?.focus(), 50)
 }
 }, [isOpen])

 useEffect(() => {
 setSelected(0)
 }, [query])

 const execute = (cmd) => {
 onClose()
 navigate(cmd.path)
 }

 const handleKey = (e) => {
 if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(i => Math.min(i + 1, results.length - 1)) }
 else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(i => Math.max(i - 1, 0)) }
 else if (e.key === 'Enter' && results[selected]) { execute(results[selected]) }
 else if (e.key === 'Escape') { onClose() }
 }

 if (!isOpen) return null

 const grouped = results.reduce((acc, cmd) => {
 ;(acc[cmd.group] ??= []).push(cmd)
 return acc
 }, {})

 let globalIdx = -1

 return (
 <FocusTrap>
 <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] px-4" onKeyDown={handleKey}>
 <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
 <div className="relative w-full max-w-lg glass-card gradient-border rounded-2xl shadow-2xl overflow-hidden">
 <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
 <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
 <input
 ref={inputRef}
 role="combobox"
 aria-autocomplete="list"
 aria-controls="command-palette-listbox"
 aria-expanded={results.length > 0}
 value={query}
 onChange={e => setQuery(e.target.value)}
 placeholder="Type a command or search..."
 className="flex-1 bg-transparent text-text-primary text-sm placeholder-gray-500 outline-none"
 />
 <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] text-text-muted font-mono">
 ESC
 </kbd>
 </div>

 <div id="command-palette-listbox" role="listbox" aria-label="Commands" className="max-h-[50vh] overflow-y-auto py-2">
 {results.length === 0 ? (
 <div className="px-4 py-8 text-center text-text-muted text-sm">No results found</div>
 ) : (
 Object.entries(grouped).map(([group, cmds]) => (
 <div key={group}>
 <div className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">{group}</div>
 {cmds.map(cmd => {
 globalIdx++
 const idx = globalIdx
 const Icon = cmd.icon
 return (
 <button
 key={cmd.id}
 role="option"
 aria-selected={selected === idx}
 onClick={() => execute(cmd)}
 className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
 selected === idx
 ? 'bg-indigo-600/20 text-indigo-300'
 : 'text-text-secondary hover:bg-white/[0.04]'
 }`}
 >
 <Icon className="w-4 h-4 flex-shrink-0" />
 <span className="flex-1 text-left">{cmd.label}</span>
 {selected === idx && <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />}
 </button>
 )
 })}
 </div>
 ))
 )}
 </div>

 <div className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-4 text-[10px] text-text-muted">
 <span><kbd className="px-1 py-0.5 rounded bg-white/[0.06] font-mono">↑↓</kbd> navigate</span>
 <span><kbd className="px-1 py-0.5 rounded bg-white/[0.06] font-mono">↵</kbd> select</span>
 <span><kbd className="px-1 py-0.5 rounded bg-white/[0.06] font-mono">esc</kbd> close</span>
 </div>
 </div>
 </div>
 </FocusTrap>
 )
}
