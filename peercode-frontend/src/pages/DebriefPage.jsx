import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, ArrowLeft, RotateCcw, BookOpen, Lightbulb, Clock, Cpu, TrendingUp } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Skeleton from '../components/common/Skeleton'
import { getDebrief, generateDebrief, getSession } from '../services/api'

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
    setError(null)
    setIsLoading(true)
    try {
      const response = await getDebrief(roomId)
      const debriefData = response.data?.data || response.data
      setDebrief(debriefData)
      setIsLoading(false)
      setIsRetrying(false)
      clearInterval(retryIntervalRef.current)
    } catch (err) {
      if (err.response?.status === 404) {
        // Debrief not ready — trigger generation if not already triggered
        try {
          const sessionRes = await getSession(roomId)
          const sessionId = sessionRes.data?._id || sessionRes.data?.data?._id
          if (sessionId) {
            await generateDebrief(sessionId)
          }
        } catch (_) {}
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
      load()
      retryIntervalRef.current = setInterval(() => {
        setRetryCount(c => c + 1)
      }, POLL_INTERVAL)
      return () => {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full animate-ping" />
              <div className="absolute inset-2 border-2 border-indigo-500/20 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <RotateCcw className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-200 mb-2">Generating Your Debrief</h2>
              <p className="text-sm text-gray-500 max-w-md">
                {isRetrying
                  ? 'AI is analyzing your session performance... this may take up to a minute'
                  : 'Initializing debrief generation...'}
              </p>
              {isRetrying && (
                <p className="text-xs text-gray-600 mt-2">
                  Attempt {Math.min(retryCount + 1, MAX_RETRIES)}/{MAX_RETRIES} &middot; polling every {POLL_INTERVAL / 1000}s
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            <button onClick={load} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all disabled:opacity-50">
              <RotateCcw className="w-4 h-4" />
              {isLoading ? 'Loading...' : 'Retry Now'}
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-200 mb-2">Failed to Load Debrief</h2>
              <p className="text-sm text-gray-500 max-w-md">{error}</p>
            </div>
            <button onClick={load} disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all">
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const overallReadiness = debrief.overallReadiness != null
    ? Math.round((debrief.overallReadiness / (debrief.overallReadiness > 10 ? 1 : 10)) * 100) : 0
  const codeQuality = debrief.codeQuality != null ? Math.round((debrief.codeQuality / 5) * 100) : 0
  const problemSolving = debrief.problemDecomposition != null ? Math.round((debrief.problemDecomposition / 5) * 100) : 0
  const communication = debrief.communication != null ? Math.round((debrief.communication / 5) * 100) : 0
  const tips = debrief.tips || debrief.studyTopics || []
  const timeComplexity = debrief.timeComplexity
  const spaceComplexity = debrief.spaceComplexity

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-6">
        {/* Breadcrumb */}
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Hero Section — Problem title + Score */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#11111f] via-[#11111f] to-[#1a1a2e] p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/5 rounded-full blur-3xl" />
          <div className="relative flex items-start justify-between flex-wrap gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{debrief.problemTitle || 'Practice Session'}</h1>
                {debrief.problemDifficulty && (
                  <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                    debrief.problemDifficulty.toLowerCase() === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : debrief.problemDifficulty.toLowerCase() === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>{debrief.problemDifficulty}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {debrief.sessionDate && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    {new Date(debrief.sessionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {debrief.duration > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {Math.round(debrief.duration / 60)} min
                  </span>
                )}
              </div>
            </div>
            <ScoreCircle value={overallReadiness} />
          </div>
        </div>

        {/* Summary Quote */}
        {debrief.summary && (
          <div className="relative border-l-4 border-l-indigo-500 bg-[#11111f] border border-white/[0.06] rounded-r-xl p-5">
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center">
              <span className="text-indigo-400 text-lg">&ldquo;</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed italic pl-2">{debrief.summary}</p>
          </div>
        )}

        {/* Performance Metrics */}
        {overallReadiness > 0 && (
          <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Performance Metrics</h2>
            </div>
            <div className="grid gap-5">
              <MetricBar label="Code Quality" value={codeQuality} color="#6d4df2" />
              <MetricBar label="Problem Solving" value={problemSolving} color="#22c55e" />
              <MetricBar label="Communication" value={communication} color="#f59e0b" />
            </div>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Strengths */}
          <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">What Went Well</h3>
            </div>
            {debrief.strengths?.length > 0 ? (
              <ul className="space-y-3">
                {debrief.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center mt-0.5">
                      <span className="text-[10px] text-emerald-400 font-bold">{i + 1}</span>
                    </span>
                    <span className="text-sm text-gray-400 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">No specific strengths recorded.</p>
            )}
          </div>

          {/* Improvements */}
          <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Areas to Improve</h3>
            </div>
            {debrief.improvements?.length > 0 ? (
              <ul className="space-y-3">
                {debrief.improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                      <span className="text-[10px] text-amber-400 font-bold">{i + 1}</span>
                    </span>
                    <span className="text-sm text-gray-400 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">No specific improvements recorded.</p>
            )}
          </div>
        </div>

        {/* Complexity + Weak Topics */}
        {(timeComplexity || spaceComplexity || debrief.weakTopics?.length > 0) && (
          <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Complexity & Weak Areas</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {timeComplexity && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-[10px] text-indigo-400/60 uppercase tracking-wider font-semibold">Time</p>
                    <p className="text-xs font-medium text-white">{timeComplexity}</p>
                  </div>
                </div>
              )}
              {spaceComplexity && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-emerald-400/60 uppercase tracking-wider font-semibold">Space</p>
                    <p className="text-xs font-medium text-white">{spaceComplexity}</p>
                  </div>
                </div>
              )}
              {debrief.weakTopics?.map(t => (
                <span key={t} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Study Next + Tips */}
        {tips.length > 0 && (
          <div className="bg-[#11111f] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Study Next</h2>
            </div>
            <div className="grid gap-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                    {i + 1}
                  </span>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          {debrief.problemSlug && (
            <Link to={`/problems/${debrief.problemSlug}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]">
              <RotateCcw className="w-4 h-4" /> Solve Again
            </Link>
          )}
          <Link to="/dashboard"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
