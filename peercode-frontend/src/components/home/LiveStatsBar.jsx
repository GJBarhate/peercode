import { useState, useEffect, useRef } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { Users, Swords, BookOpen, Wifi } from 'lucide-react'

function AnimatedNumber({ value }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 })
  const display = useTransform(spring, v => Math.round(v).toLocaleString())
  const ref = useRef(null)

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    return display.on('change', v => {
      if (ref.current) ref.current.textContent = v
    })
  }, [display])

  return <span ref={ref}>0</span>
}

const statConfig = [
  { key: 'onlineNow', label: 'Online Now', icon: Wifi, color: 'text-green-400' },
  { key: 'matchesToday', label: 'Matches Today', icon: Swords, color: 'text-indigo-400' },
  { key: 'totalMatches', label: 'Total Sessions', icon: Users, color: 'text-purple-400' },
  { key: 'totalProblems', label: 'Problems', icon: BookOpen, color: 'text-cyan-400' },
]

export default function LiveStatsBar({ stats }) {
  if (!stats) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
      {statConfig.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-lg font-bold text-gray-100">
            <AnimatedNumber value={stats[key] || 0} />
          </span>
          <span className="text-sm text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  )
}
