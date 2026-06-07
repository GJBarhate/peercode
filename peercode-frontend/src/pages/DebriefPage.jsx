import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, ArrowLeft, RotateCcw, BookOpen, Lightbulb, Clock, Cpu } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Skeleton from '../components/common/Skeleton'
import { getDebrief } from '../services/api'

const MAX_RETRIES = 5
const POLL_INTERVAL = 10000

function ScoreCircle({ value }) {
  const r = 70
  const sw = 10
  const circumference = 2 * Math.PI * r
  const pct = Math.min(1, Math.max(0, value / 100))
  const offset = circumference * (1 - pct)
  const color = value < 40 ? '#ef4444' : value < 70 ? '#f59e0b' : '#22c55e'

  return (
    <div className="relative w-40 h-40">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-[#f1f1f5]">{value}</span>
        <span className="text-xs text-[#5a5a72] font-medium mt-1">/100</span>
        <span className="text-[10px] text-[#5a5a72] mt-1">Overall Score</span>
      </div>
    </div>
  )
}

function MetricBar({ label, value, color = '#6d4df2' }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-[#f1f1f5] font-medium">{label}</span>
        <span className="text-sm text-[#5a5a72]">{value}/100</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function DebriefPage() {
  const { roomId } = useParams()
  const [debrief, setDebrief] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const retryIntervalRef = useRef(null)

  async function load() {
    if (!roomId) return
    try {
      const response = await getDebrief(roomId)
      const debriefData = response.data?.data || response.data
      setDebrief(debriefData)
      setError(null)
      setIsLoading(false)
      setIsRetrying(false)
      clearInterval(retryIntervalRef.current)
    } catch (err) {
      if (err.response?.status === 404) {
        setIsRetrying(true)
        setIsLoading(false)
        return
      }
      setError(err.response?.data?.message || err.message || 'Failed to load debrief')
      setIsLoading(false)
      setIsRetrying(false)
    }
  }

  useEffect(() => {
    if (roomId) {
      const initialDelay = setTimeout(() => load(), 2000)
      retryIntervalRef.current = setInterval(() => {
        setRetryCount(c => c + 1)
      }, POLL_INTERVAL)
      return () => {
        clearTimeout(initialDelay)
        if (retryIntervalRef.current) clearInterval(retryIntervalRef.current)
      }
    }
  }, [roomId])

  useEffect(() => {
    if (retryCount > 0 && !debrief) {
      if (retryCount <= MAX_RETRIES) {
        load()
      } else {
        clearInterval(retryIntervalRef.current)
        setIsRetrying(false)
        setError('Debrief generation is taking longer than expected. Please try again later.')
      }
    }
  }, [retryCount])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-44 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!debrief && !error) {
    return (
      <div className="min-h-screen bg-[#0a0a14]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-44 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <div className="flex flex-col items-center gap-3 pt-2">
            {isRetrying && (
              <p className="text-xs text-[#5a5a72] animate-pulse">Generating AI debrief... this may take up to a minute</p>
            )}
            <button onClick={load} className="flex items-center gap-2 text-sm text-[#6d4df2] hover:text-[#7c5ff5]">
              <RotateCcw className="w-4 h-4" />
              Retry now
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a14]">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-[#ef4444]">{error}</p>
          <button onClick={load} className="btn-secondary text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const overallReadiness = debrief.overallReadiness != null
    ? Math.round((debrief.overallReadiness / (debrief.overallReadiness > 10 ? 1 : 10)) * 100)
    : 0

  const codeQuality = debrief.codeQuality != null ? Math.round((debrief.codeQuality / 5) * 100) : 0
  const problemSolving = debrief.problemDecomposition != null ? Math.round((debrief.problemDecomposition / 5) * 100) : 0
  const communication = debrief.communication != null ? Math.round((debrief.communication / 5) * 100) : 0

  const tips = debrief.tips || debrief.studyTopics?.slice(0, 5) || []
  const timeComplexity = debrief.timeComplexity || debrief.weakTopics?.[0] || null
  const spaceComplexity = debrief.spaceComplexity || debrief.weakTopics?.[1] || null

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-[#5a5a72] hover:text-[#f1f1f5] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        {/* TOP: Problem title + difficulty badge + date + duration */}
        <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-[#f1f1f5]">{debrief.problemTitle || 'Practice Session'}</h1>
                {debrief.problemDifficulty && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    debrief.problemDifficulty.toLowerCase() === 'easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : debrief.problemDifficulty.toLowerCase() === 'hard' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {debrief.problemDifficulty}
                  </span>
                )}
              </div>
              {debrief.sessionDate && (
                <p className="text-sm text-[#5a5a72]">
                  Session on {new Date(debrief.sessionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {debrief.duration ? ` · ${Math.round(debrief.duration / 60)} min` : ''}
                </p>
              )}
            </div>

            {/* Score Ring */}
            <ScoreCircle value={overallReadiness} />
          </div>
        </div>

        {/* Summary card with border-left */}
        {debrief.summary && (
          <div className="border-l-4 border-l-[#6d4df2] bg-[#11111f] border border-white/[0.06] rounded-r-xl p-5 mb-6">
            <p className="text-sm text-[#9191a8] leading-relaxed italic">&ldquo;{debrief.summary}&rdquo;</p>
          </div>
        )}

        {/* Metric bars */}
        <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-[#f1f1f5] mb-4">Performance Metrics</h3>
          <MetricBar label="Code Quality" value={codeQuality} color="#6d4df2" />
          <MetricBar label="Problem Solving" value={problemSolving} color="#22c55e" />
          <MetricBar label="Communication" value={communication} color="#f59e0b" />
        </div>

        {/* Two columns: Strengths + Improvements */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-green-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {(debrief.strengths || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2 border-l-2 border-green-500/30 pl-3">
                  <span className="text-sm text-[#9191a8]">{s}</span>
                </li>
              ))}
              {(!debrief.strengths || debrief.strengths.length === 0) && (
                <li className="text-sm text-[#5a5a72]">No specific strengths recorded.</li>
              )}
            </ul>
          </div>

          <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Improvements
            </h3>
            <ul className="space-y-2">
              {(debrief.improvements || []).map((item, i) => (
                <li key={i} className="flex items-start gap-2 border-l-2 border-amber-500/30 pl-3">
                  <span className="text-sm text-[#9191a8]">{item}</span>
                </li>
              ))}
              {(!debrief.improvements || debrief.improvements.length === 0) && (
                <li className="text-sm text-[#5a5a72]">No specific improvements recorded.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Complexity badges */}
        {(timeComplexity || spaceComplexity) && (
          <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-[#f1f1f5] mb-3">Complexity Analysis</h3>
            <div className="flex flex-wrap gap-3">
              {timeComplexity && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6d4df2]/10 border border-[#6d4df2]/20">
                  <Clock className="w-3.5 h-3.5 text-[#6d4df2]" />
                  <span className="text-xs font-medium text-[#f1f1f5]">Time: {timeComplexity}</span>
                </div>
              )}
              {spaceComplexity && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20">
                  <Cpu className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span className="text-xs font-medium text-[#f1f1f5]">Space: {spaceComplexity}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips section */}
        {tips.length > 0 && (
          <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-[#f1f1f5] mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#f59e0b]" />
              Tips
            </h3>
            <ol className="space-y-3">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6d4df2]/10 border border-[#6d4df2]/20 flex items-center justify-center text-xs font-medium text-[#6d4df2]">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[#9191a8] leading-relaxed">{tip}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Study topics */}
        {debrief.studyTopics && debrief.studyTopics.length > 0 && (
          <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-[#f1f1f5] mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#6d4df2]" />
              Study Next
            </h3>
            <div className="flex flex-wrap gap-2">
              {debrief.studyTopics.map(t => (
                <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-[#6d4df2]/10 text-[#a78bfa] border border-[#6d4df2]/20">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex items-center gap-3">
          {debrief.problemSlug && (
            <Link
              to={`/problems/${debrief.problemSlug}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#6d4df2] hover:bg-[#7c5ff5] text-white transition-all duration-150 active:scale-[0.98]"
            >
              Practice Again →
            </Link>
          )}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white/5 hover:bg-white/10 text-[#9191a8] hover:text-[#f1f1f5] border border-white/10 transition-all duration-150"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
