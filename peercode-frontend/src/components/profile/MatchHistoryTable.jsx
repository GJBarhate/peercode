import { memo } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'

const difficultyColor = {
 easy: 'text-green-400',
 medium: 'text-yellow-400',
 hard: 'text-red-400',
}

function formatDuration(seconds) {
 const m = Math.floor(seconds / 60)
 const s = seconds % 60
 return `${m}:${String(s).padStart(2, '0')}`
}

export const MatchHistoryTable = memo(function MatchHistoryTable({ matches }) {
 if (!matches?.length) {
 return (
 <div className="text-center py-8 text-text-muted text-sm">No matches yet</div>
 )
 }

 return (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="text-left text-xs text-text-muted border-b border-border-default">
 <th className="pb-2 font-medium">Problem</th>
 <th className="pb-2 font-medium">Result</th>
 <th className="pb-2 font-medium">ELO</th>
 <th className="pb-2 font-medium">Duration</th>
 <th className="pb-2 font-medium">Date</th>
 <th className="pb-2 font-medium"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-800/50">
 {matches.map((m, i) => (
 <tr key={m.roomId || i} className="hover:bg-bg-elevated/30 transition-colors">
 <td className="py-2.5 pr-4">
 <span className="text-text-primary font-medium truncate block max-w-[160px]">{m.problem || 'Practice'}</span>
 <span className={`text-xs capitalize ${difficultyColor[m.difficulty] || 'text-text-muted'}`}>{m.difficulty}</span>
 </td>
 <td className="py-2.5 pr-4">
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
 m.result === 'solved'
 ? 'bg-green-500/10 text-green-400'
 : 'bg-bg-overlay text-text-muted'
 }`}>
 {m.result === 'solved' ? 'Solved' : 'Attempted'}
 </span>
 </td>
 <td className="py-2.5 pr-4">
 {m.eloDelta !== undefined ? (
 <span className={`flex items-center gap-1 font-medium ${m.eloDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
 {m.eloDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
 {m.eloDelta >= 0 ? '+' : ''}{m.eloDelta}
 </span>
 ) : '—'}
 </td>
 <td className="py-2.5 pr-4 text-text-muted">{m.duration ? formatDuration(m.duration) : '—'}</td>
 <td className="py-2.5 pr-4 text-text-muted">
 {m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
 </td>
 <td className="py-2.5">
 {m.roomId && (
 <Link to={`/playback/${m.roomId}`} className="text-text-muted hover:text-indigo-400 transition-colors">
 <ExternalLink className="w-3.5 h-3.5" />
 </Link>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )
})
