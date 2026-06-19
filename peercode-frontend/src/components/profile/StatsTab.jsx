import { useState, useEffect } from 'react'
import { BarChart3, Target, Clock, Trophy } from 'lucide-react'
import { EloHistoryChart } from './EloHistoryChart'
import { TagRadarChart } from './TagRadarChart'
import { MatchHistoryTable } from './MatchHistoryTable'
import { RankCard } from './RankCard'
import api from '../../services/api'

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-black text-gray-100">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function StatsTab({ profile }) {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/users/me/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const s = stats?.stats || {}
  const eloHistory = stats?.eloHistory || []
  const recentMatches = stats?.recentMatches || []
  const rank = stats?.rank
  const percentile = stats?.percentile

  return (
    <div className="space-y-6">
      <RankCard
        username={profile?.username || ''}
        elo={profile?.elo || 1200}
        rank={rank}
        percentile={percentile}
        wins={s.wins || 0}
        totalMatches={s.totalMatches || 0}
        winRate={s.winRate || 0}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Matches" value={s.totalMatches || 0} icon={BarChart3} color="bg-indigo-600" />
        <StatCard label="Win Rate" value={`${s.winRate || 0}%`} sub={`${s.wins || 0}W / ${s.losses || 0}L`} icon={Trophy} color="bg-emerald-600" />
        <StatCard label="Acceptance" value={`${s.acceptanceRate || 0}%`} sub={`${s.totalAccepted || 0} / ${s.totalSubmissions || 0}`} icon={Target} color="bg-violet-600" />
        <StatCard label="Avg Duration" value={`${Math.round((s.avgMatchDuration || 0) / 60)}m`} icon={Clock} color="bg-cyan-600" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">ELO History</h3>
        <EloHistoryChart data={eloHistory} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Tag Breakdown</h3>
        <TagRadarChart solvedByTag={s.solvedByTag} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Recent Matches</h3>
        <MatchHistoryTable matches={recentMatches} />
      </div>
    </div>
  )
}
