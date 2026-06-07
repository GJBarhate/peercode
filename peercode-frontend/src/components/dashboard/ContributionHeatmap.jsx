import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const CELL_SIZE = 11
const CELL_GAP = 2
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['Mon', 'Wed', 'Fri']
const DAY_INDICES = [1, 3, 5]
const COLORS = ['#1a1a2e', '#3d2b7a', '#5c3d99', '#7c52c8', '#a78bfa']

function getColor(count) {
  if (count === 0) return COLORS[0]
  if (count === 1) return COLORS[1]
  if (count <= 3) return COLORS[2]
  if (count <= 6) return COLORS[3]
  return COLORS[4]
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function TooltipPortal({ day, rect }) {
  if (!day || !rect) return null
  return createPortal(
    <div
      className="fixed z-[9999] px-3 py-2 rounded-lg shadow-xl pointer-events-none"
      style={{
        left: rect.left + rect.width / 2,
        top: rect.top - 8,
        transform: 'translate(-50%, -100%)',
        background: '#181830',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <p className="text-xs text-[#f1f1f5] whitespace-nowrap">
        {formatDate(day.date)} · {day.count} session{day.count !== 1 ? 's' : ''}
      </p>
    </div>,
    document.body
  )
}

export default function ContributionHeatmap({ sessions = [] }) {
  const [tooltip, setTooltip] = useState(null)
  const containerRef = useRef(null)

  const { weeks, monthLabels, total, maxDay } = useMemo(() => {
    const today = new Date()
    const activity = {}
    const allDays = []

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      activity[key] = 0
      allDays.push({ date: key, dateObj: new Date(date) })
    }

    sessions.forEach(s => {
      const date = new Date(s.createdAt).toISOString().split('T')[0]
      if (activity[date] !== undefined) activity[date]++
    })

    const weeks = []
    let currentWeek = []
    allDays.forEach(day => {
      currentWeek.push({ date: day.date, count: activity[day.date] || 0, dateObj: day.dateObj })
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })
    if (currentWeek.length > 0) weeks.push(currentWeek)

    const monthLabels = []
    let lastMonth = -1
    weeks.forEach((week, weekIndex) => {
      const month = week[0].dateObj.getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ month, weekIndex })
        lastMonth = month
      }
    })

    const total = sessions.length
    const maxDay = Math.max(...Object.values(activity), 0)

    return { weeks, monthLabels, total, maxDay }
  }, [sessions])

  const handleMouseEnter = useCallback((day, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ day, rect })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#11111f] p-6" ref={containerRef}>
      {/* Summary line */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[#f1f1f5]">Contribution Heatmap</h3>
        <p className="text-xs text-[#5a5a72]">
          {total} sessions in the last year · Max: {maxDay}/day
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-[#5a5a72]">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No sessions yet. Start practicing!</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto pb-4">
            {/* Month labels */}
            <div className="flex ml-[42px] mb-[2px]" style={{ gap: `${CELL_GAP}px` }}>
              {monthLabels.map((label, i) => {
                const w = (label.weekIndex + 1 - (monthLabels[i - 1]?.weekIndex || 0)) * (CELL_SIZE + CELL_GAP) - CELL_GAP
                return (
                  <span
                    key={i}
                    className="text-[10px] text-[#5a5a72] font-medium leading-none"
                    style={{ width: `${Math.max(w, CELL_SIZE)}px` }}
                  >
                    {MONTHS[label.month]}
                  </span>
                )
              })}
            </div>

            <div className="flex" style={{ gap: `${CELL_GAP}px` }}>
              {/* Day labels */}
              <div className="flex flex-col shrink-0 pt-[2px]" style={{ gap: `${CELL_GAP}px`, width: '36px' }}>
                {DAY_INDICES.map((_, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-[#5a5a72] font-medium leading-none flex items-center"
                    style={{ height: `${CELL_SIZE}px` }}
                  >
                    {DAY_LABELS[i]}
                  </div>
                ))}
                {/* Spacer rows for alignment */}
                {DAY_INDICES.length < 7 && (
                  <div style={{ height: `${(7 - DAY_INDICES.length) * (CELL_SIZE + CELL_GAP) - CELL_GAP}px` }} />
                )}
              </div>

              {/* Grid */}
              <div className="flex" style={{ gap: `${CELL_GAP}px` }}>
                {weeks.map((week, i) => (
                  <div key={i} className="flex flex-col" style={{ gap: `${CELL_GAP}px` }}>
                    {week.map((day, j) => (
                      <div
                        key={j}
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseLeave={handleMouseLeave}
                        className="rounded-sm cursor-pointer transition-transform duration-150 hover:scale-[1.4] hover:z-10 relative"
                        style={{
                          width: `${CELL_SIZE}px`,
                          height: `${CELL_SIZE}px`,
                          backgroundColor: getColor(day.count),
                          borderRadius: '2px',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-4 text-[10px] text-[#5a5a72]">
            <span>Less</span>
            {COLORS.map((color, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  backgroundColor: color,
                  borderRadius: '2px',
                }}
              />
            ))}
            <span>More</span>
          </div>
        </>
      )}

      {tooltip && <TooltipPortal day={tooltip.day} rect={tooltip.rect} />}
    </div>
  )
}
