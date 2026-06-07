import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { Code2, RotateCcw, Clock, Languages } from 'lucide-react'
import Skeleton from '../common/Skeleton'
import { getAnalytics } from '../../services/api'

export default function SessionAnalytics({ roomId }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const { data: res } = await getAnalytics(roomId)
        setData(res)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [roomId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-red-400 text-sm">{error}</div>
  }

  if (!data) return null

  const stats = [
    { label: 'Total Revisions', value: data.totalRevisions ?? 0, icon: Code2, color: 'text-indigo-400' },
    { label: 'Approach Restarts', value: data.approachRestarts ?? 0, icon: RotateCcw, color: 'text-amber-400' },
    { label: 'Session Duration', value: data.durationMinutes ? `${data.durationMinutes}m` : '—', icon: Clock, color: 'text-green-400' },
    { label: 'Languages Used', value: (data.languages || []).join(', ') || '—', icon: Languages, color: 'text-blue-400' }
  ]

  const chartData = (data.codeGrowthCurve || []).map((point, i) => ({
    t: i,
    lines: point.lines ?? point
  }))

  const activitySegments = data.activityTimeline || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-xl font-bold text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      {chartData.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-300 mb-4">Code Growth Over Time</h4>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="codeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" hide />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#818cf8' }}
              />
              {(data.pauseSegments || []).map((seg, i) => (
                <ReferenceLine key={i} x={seg.index} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />
              ))}
              <Area
                type="monotone"
                dataKey="lines"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#codeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {activitySegments.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Activity Timeline</h4>
          <div className="flex gap-0.5 h-6">
            {activitySegments.slice(0, 60).map((seg, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  backgroundColor:
                    seg === 'active' ? '#22c55e' :
                    seg === 'pause' ? '#ef4444' :
                    '#1f2937'
                }}
                title={seg}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2">
            {[
              { color: 'bg-green-500', label: 'Active' },
              { color: 'bg-red-500', label: 'Paused' },
              { color: 'bg-gray-800', label: 'Idle' }
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
