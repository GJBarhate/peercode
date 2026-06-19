import { memo } from 'react'
import { Trophy, TrendingUp } from 'lucide-react'

function getRankTitle(elo) {
  if (elo >= 1800) return { title: 'Grandmaster', color: 'from-pink-500 to-red-600' }
  if (elo >= 1600) return { title: 'Elite Coder', color: 'from-purple-500 to-violet-600' }
  if (elo >= 1400) return { title: 'Expert', color: 'from-indigo-500 to-blue-600' }
  if (elo >= 1200) return { title: 'Rising Star', color: 'from-cyan-500 to-teal-600' }
  return { title: 'Novice', color: 'from-gray-500 to-gray-600' }
}

export const RankCard = memo(function RankCard({ username, elo = 1200, rank, percentile, wins = 0, totalMatches = 0, winRate = 0 }) {
  const { title, color } = getRankTitle(elo)

  return (
    <div className={`relative rounded-2xl p-5 bg-gradient-to-br ${color} overflow-hidden`}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">PeerCode</div>
            <div className="text-2xl font-black text-white">{username}</div>
          </div>
          <Trophy className="w-8 h-8 text-white/80" />
        </div>
        <div className="flex items-end gap-3 mb-4">
          <div>
            <div className="text-xs text-white/60">ELO Rating</div>
            <div className="text-4xl font-black text-white">{elo}</div>
          </div>
          <div className="mb-1">
            <div className={`text-sm font-bold text-white/90 bg-white/20 px-2.5 py-0.5 rounded-full`}>{title}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-white/20 pt-3">
          <div>
            <div className="text-xs text-white/60">Global Rank</div>
            <div className="font-bold text-white">#{rank || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-white/60">Top</div>
            <div className="font-bold text-white">{percentile ? `${percentile}%` : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-white/60">Win Rate</div>
            <div className="font-bold text-white">{winRate}%</div>
          </div>
        </div>
      </div>
    </div>
  )
})
