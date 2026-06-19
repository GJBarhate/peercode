import { memo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs">
      <div className="text-indigo-400 font-bold">ELO: {d.rating}</div>
      <div className="text-gray-400">{new Date(d.date).toLocaleDateString()}</div>
      {d.delta !== undefined && (
        <div className={d.delta >= 0 ? 'text-green-400' : 'text-red-400'}>
          {d.delta >= 0 ? '+' : ''}{d.delta}
        </div>
      )}
    </div>
  )
}

export const EloHistoryChart = memo(function EloHistoryChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No ELO history yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="date"
          tickFormatter={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="rating"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#6366f1' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
})
