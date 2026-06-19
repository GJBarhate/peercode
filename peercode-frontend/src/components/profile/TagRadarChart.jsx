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
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        Solve tagged problems to see your breakdown
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#1f2937" />
        <PolarAngleAxis dataKey="tag" tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <Radar dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#e5e7eb' }}
          itemStyle={{ color: '#a78bfa' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
})
