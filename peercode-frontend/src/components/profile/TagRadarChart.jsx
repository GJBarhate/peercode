import { memo } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

const TAGS = ['Arrays', 'DP', 'Graphs', 'Trees', 'Greedy', 'Math', 'Strings', 'Binary Search']

export const TagRadarChart = memo(function TagRadarChart({ solvedByTag }) {
 const tagMap = solvedByTag instanceof Map ? Object.fromEntries(solvedByTag) : (solvedByTag || {})

 const data = TAGS.map(tag => {
 const count = tagMap[tag] || tagMap[tag.toLowerCase()] || tagMap[tag.replace(' ', '_')] || 0
 return { tag, count }
 })

 const hasData = data.some(d => d.count > 0)
 if (!hasData) {
 return (
 <div className="flex items-center justify-center h-48 text-text-muted text-sm">
 Solve tagged problems to see your breakdown
 </div>
 )
 }

 return (
 <ResponsiveContainer width="100%" height={220}>
 <RadarChart data={data}>
 <PolarGrid stroke="var(--color-chart-grid)" />
 <PolarAngleAxis dataKey="tag" tick={{ fill: 'var(--color-chart-axis)', fontSize: 11 }} />
 <Radar dataKey="count" stroke="var(--color-brand)" fill="var(--color-brand)" fillOpacity={0.3} />
 <Tooltip
 contentStyle={{ background: 'var(--color-chart-tooltip-bg)', border: '1px solid var(--color-chart-tooltip-border)', borderRadius: 8, fontSize: 12 }}
 labelStyle={{ color: 'var(--color-chart-tooltip-text)' }}
 itemStyle={{ color: 'var(--color-brand)' }}
 />
 </RadarChart>
 </ResponsiveContainer>
 )
})
