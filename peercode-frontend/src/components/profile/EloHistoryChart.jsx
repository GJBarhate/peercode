import { memo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload }) => {
 if (!active || !payload?.length) return null
 const d = payload[0].payload
 return (
 <div className="bg-bg-surface border border-border-strong rounded-lg p-2 text-xs">
 <div className="text-brand font-bold">ELO: {d.rating}</div>
 <div className="text-text-muted">{new Date(d.date).toLocaleDateString()}</div>
 {d.delta !== undefined && (
 <div className={d.delta >= 0 ? 'text-green-600' : 'text-red-600'}>
 {d.delta >= 0 ? '+' : ''}{d.delta}
 </div>
 )}
 </div>
 )
}

export const EloHistoryChart = memo(function EloHistoryChart({ data }) {
 if (!data?.length) {
 return (
 <div className="flex items-center justify-center h-48 text-text-muted text-sm">
 No ELO history yet
 </div>
 )
 }

 return (
 <ResponsiveContainer width="100%" height={220}>
 <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
 <XAxis
 dataKey="date"
 tickFormatter={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
 tick={{ fill: 'var(--color-chart-axis)', fontSize: 11 }}
 tickLine={false}
 axisLine={false}
 />
 <YAxis
 domain={['auto', 'auto']}
 tick={{ fill: 'var(--color-chart-axis)', fontSize: 11 }}
 tickLine={false}
 axisLine={false}
 width={45}
 />
 <Tooltip content={<CustomTooltip />} />
 <Line
 type="monotone"
 dataKey="rating"
 stroke="var(--color-brand)"
 strokeWidth={2}
 dot={false}
 activeDot={{ r: 4, fill: 'var(--color-brand)' }}
 />
 </LineChart>
 </ResponsiveContainer>
 )
})
