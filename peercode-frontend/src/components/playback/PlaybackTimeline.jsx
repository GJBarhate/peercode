import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'

export default function PlaybackTimeline({ snapshots = [], currentIndex, onChange }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef(null)
  const total = snapshots.length

  useEffect(() => {
    if (!isPlaying) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      onChange(prev => {
        if (prev >= total - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1000 / speed)
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, total, onChange])

  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    onChange(Math.floor(pct * (total - 1)))
  }

  const progress = total > 1 ? currentIndex / (total - 1) : 0

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <div
        className="relative h-2 bg-gray-700 rounded-full cursor-pointer"
        onClick={handleScrub}
      >
        <div
          className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-400 rounded-full shadow-lg border-2 border-gray-900 cursor-grab"
          style={{ left: `calc(${progress * 100}% - 8px)` }}
        />
        {snapshots.map((s, i) => (
          s.isApproachRestart ? (
            <div
              key={i}
              className="absolute top-0 w-1 h-full bg-amber-500 rounded"
              style={{ left: `${total > 1 ? (i / (total - 1)) * 100 : 0}%` }}
              title="Approach restart"
            />
          ) : null
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(0)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChange(i => Math.max(0, i - 1))}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onChange(i => Math.min(total - 1, i + 1))}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChange(total - 1)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {currentIndex + 1} / {total}
          </span>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
            {[0.5, 1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  speed === s ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
