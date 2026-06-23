import { memo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Crown } from 'lucide-react'

const rankColors = {
 1: 'text-amber-400',
 2: 'text-text-secondary',
 3: 'text-amber-600',
}

const rankBg = {
 1: 'bg-amber-500/10 border-amber-500/20',
 2: 'bg-bg-overlay border-border-subtle',
 3: 'bg-amber-700/10 border-amber-700/20',
}

export const LeaderboardRow = memo(function LeaderboardRow({ row, isCurrentUser }) {
 const isMedal = row.rank <= 3
 return (
 <motion.div
 layout
 layoutId={row.username}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ type: 'spring', stiffness: 300, damping: 30 }}
 className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
 isCurrentUser
 ? 'bg-indigo-500/10 border-indigo-500/20'
 : isMedal
 ? `${rankBg[row.rank]}`
 : 'bg-bg-surface/40 border-white/[0.04] hover:bg-bg-elevated/50'
 }`}
 >
 <div className={`w-8 text-center font-bold text-sm ${rankColors[row.rank] || 'text-text-muted'}`}>
 {row.rank <= 3 ? (
 <Trophy className={`w-4 h-4 mx-auto ${rankColors[row.rank] || 'text-text-muted'}`} />
 ) : (
 `#${row.rank}`
 )}
 </div>

 <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
 {row.profilePicture
 ? <img src={row.profilePicture} alt={row.username} className="w-full h-full rounded-full object-cover" />
 : row.username[0]?.toUpperCase()
 }
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-indigo-300' : 'text-text-primary'}`}>
 {row.username}
 </span>
 {isCurrentUser && (
 <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
 You
 </span>
 )}
 </div>
 <div className="text-xs text-text-muted">{row.totalMatches} matches · {row.winRate}% WR</div>
 </div>

 <div className="text-right">
 <div className="font-bold text-indigo-400">{row.elo}</div>
 <div className="text-xs text-text-muted">{row.wins}W</div>
 </div>
 </motion.div>
 )
})
