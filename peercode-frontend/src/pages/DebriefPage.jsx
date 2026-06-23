import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, ArrowLeft, RotateCcw, BookOpen, Cpu, TrendingUp, Clock, Zap, Target, Brain, MessageSquare, Code2, Share2, Star, GitBranch, Eye, Lightbulb, ExternalLink } from 'lucide-react'
import Skeleton from '../components/common/Skeleton'
import { getDebrief, generateDebrief, getSession, submitPartnerRating } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const MAX_RETRIES = 5
const POLL_INTERVAL = 10000

function ScoreCircle({ value }) {
 const r = 70
 const sw = 10
 const circumference = 2 * Math.PI * r
 const pct = Math.min(1, Math.max(0, value / 100))
 const offset = circumference * (1 - pct)
 const color = value < 40 ? '#ef4444' : value < 70 ? '#f59e0b' : '#22c55e'
 const label = value < 40 ? 'Needs Work' : value < 70 ? 'Good Progress' : 'Interview Ready'

 return (
 <div className="flex flex-col items-center gap-2">
 <div className="relative w-40 h-40">
 <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
 <circle cx="80" cy="80" r={r} fill="none" stroke="var(--color-border-subtle)" strokeWidth={sw} />
 <circle
 cx="80" cy="80" r={r}
 fill="none"
 stroke={color}
 strokeWidth={sw}
 strokeLinecap="round"
 strokeDasharray={circumference}
 strokeDashoffset={offset}
 style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-4xl font-black text-text-primary">{value}</span>
 <span className="text-xs text-text-muted font-medium mt-0.5">/100</span>
 </div>
 </div>
 <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
 {label}
 </span>
 </div>
 )
}

function MetricBar({ label, value, color = '#6d4df2', icon: Icon }) {
 return (
 <div className="group p-4 rounded-xl bg-bg-elevated/50 hover:bg-bg-hover/60 border border-border-subtle hover:border-border-default transition-all duration-200">
 <div className="flex items-center justify-between mb-2.5">
 <div className="flex items-center gap-2">
 {Icon && <Icon className="w-4 h-4" style={{ color }} />}
 <span className="text-sm text-text-primary font-medium">{label}</span>
 </div>
 <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}<span className="text-text-muted font-normal text-xs">/100</span></span>
 </div>
 <div className="w-full bg-bg-overlay/30 rounded-full h-2 overflow-hidden">
 <div
 className="h-full rounded-full transition-all duration-700 ease-out"
 style={{ width: `${Math.min(100, value)}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
 />
 </div>
 </div>
 )
}

function ScoreCard({ label, value, max, color, icon: Icon }) {
 const pct = Math.round((value / max) * 100)
 return (
 <div className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-bg-elevated/50 hover:bg-bg-hover/60 border border-border-subtle hover:border-border-default transition-all duration-200 cursor-default">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
 <Icon className="w-5 h-5" style={{ color }} />
 </div>
 <div className="text-center">
 <div className="text-2xl font-black" style={{ color }}>{value}<span className="text-xs text-text-muted font-normal">/{max}</span></div>
 <div className="text-[11px] text-text-muted font-medium mt-0.5">{label}</div>
 </div>
 <div className="w-full bg-bg-overlay/30 rounded-full h-1 overflow-hidden">
 <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
 </div>
 </div>
 )
}

export default function DebriefPage() {
 const { roomId } = useParams()
 const { user } = useAuth()
 const [debrief, setDebrief] = useState(null)
 const [isLoading, setIsLoading] = useState(true)
 const [error, setError] = useState(null)
 const [retryCount, setRetryCount] = useState(0)
 const [isRetrying, setIsRetrying] = useState(false)
 const retryIntervalRef = useRef(null)
 const [activeTab, setActiveTab] = useState('overview')
 const [partner, setPartner] = useState(null)
 const [rating, setRating] = useState(0)
 const [hoverRating, setHoverRating] = useState(0)
 const [ratingFeedback, setRatingFeedback] = useState('')
 const [ratingSubmitted, setRatingSubmitted] = useState(false)
 const [ratingSubmitting, setRatingSubmitting] = useState(false)
 const [sessionMongoId, setSessionMongoId] = useState(null)
 const [isFallback, setIsFallback] = useState(false)
 const [isRegenerating, setIsRegenerating] = useState(false)

 async function load() {
 if (!roomId) return
 setError(null)
 setIsLoading(true)
 try {
 const [debriefRes, sessionRes] = await Promise.allSettled([
 getDebrief(roomId),
 getSession(roomId),
 ])
 if (debriefRes.status === 'rejected') throw debriefRes.reason
 const debriefData = debriefRes.value.data?.data || debriefRes.value.data
 setDebrief(debriefData)
 setIsFallback(!!debriefData?.isFallback)
 if (sessionRes.status === 'fulfilled') {
 const sessionData = sessionRes.value.data?.data || sessionRes.value.data
 const sid = sessionData?._id
 if (sid) setSessionMongoId(sid)
 const participants = sessionData?.participants || []
 const partnerId = participants.find(id => String(id) !== String(user?._id || user?.id))
 if (partnerId) setPartner({ _id: partnerId })
 }
 setIsLoading(false)
 setIsRetrying(false)
 clearInterval(retryIntervalRef.current)
 } catch (err) {
 if (err.response?.status === 404) {
 try {
 const sessionRes = await getSession(roomId)
 const sessionData = sessionRes.value?.data || sessionRes.data?.data || sessionRes.data
 const sessionId = sessionData?._id || sessionData?.data?._id
 if (sessionId) {
 setSessionMongoId(sessionId)
 await generateDebrief(sessionId)
 }
 const participants = sessionData?.participants || []
 const partnerId = participants.find(id => String(id) !== String(user?._id || user?.id))
 if (partnerId) setPartner({ _id: partnerId })
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

 async function regenerateDebrief() {
 if (!sessionMongoId) return
 setIsRegenerating(true)
 try {
 await generateDebrief(sessionMongoId)
 await load()
 } catch (_) {
 toast.error('Failed to regenerate debrief. Please try again.')
 } finally {
 setIsRegenerating(false)
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
 <div className="min-h-screen bg-bg-base">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-5">
 <Skeleton className="h-6 w-36" />
 <Skeleton className="h-52 w-full" />
 <Skeleton className="h-16 w-full" />
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
 </div>
 <div className="grid md:grid-cols-2 gap-4">
 <Skeleton className="h-52" />
 <Skeleton className="h-52" />
 </div>
 <Skeleton className="h-40 w-full" />
 </div>
 </div>
 )
 }

 if (!debrief && !error) {
 return (
 <div className="min-h-screen bg-bg-base">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16">
 <div className="flex flex-col items-center justify-center min-h-[55vh] gap-6">
 <div className="relative w-24 h-24">
 <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full animate-ping" />
 <div className="absolute inset-3 border-2 border-indigo-500/20 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
 <div className="absolute inset-6 border-2 border-indigo-500/10 rounded-full animate-ping" style={{ animationDelay: '0.8s' }} />
 <div className="absolute inset-0 flex items-center justify-center">
 <Brain className="w-9 h-9 text-indigo-400 animate-pulse" />
 </div>
 </div>
 <div className="text-center">
 <h2 className="text-2xl font-bold text-text-primary mb-2">Analyzing Your Session</h2>
 <p className="text-sm text-text-muted max-w-sm leading-relaxed">
 {isRetrying
 ? 'AI is reviewing your code and problem-solving approach. This takes up to a minute.'
 : 'Initializing AI analysis...'}
 </p>
 {isRetrying && (
 <p className="text-xs text-text-muted mt-3 tabular-nums">
 Check {Math.min(retryCount + 1, MAX_RETRIES)} of {MAX_RETRIES} &middot; next in {POLL_INTERVAL / 1000}s
 </p>
 )}
 </div>
 <div className="flex items-center gap-2">
 {[0, 0.2, 0.4].map((d, i) => (
 <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
 ))}
 </div>
 <button onClick={load} disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-indigo-400 hover:text-text-primary bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 transition-all disabled:opacity-50 active:scale-[0.98]">
 <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
 {isLoading ? 'Checking...' : 'Check Now'}
 </button>
 </div>
 </div>
 </div>
 )
 }

 if (error) {
 return (
 <div className="min-h-screen bg-bg-base">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16">
 <div className="flex flex-col items-center justify-center min-h-[55vh] gap-6">
 <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
 <AlertTriangle className="w-9 h-9 text-red-400" />
 </div>
 <div className="text-center">
 <h2 className="text-2xl font-bold text-text-primary mb-2">Failed to Load Debrief</h2>
 <p className="text-sm text-text-muted max-w-sm">{error}</p>
 </div>
 <button onClick={load} disabled={isLoading} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-text-primary bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]">
 <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
 {isLoading ? 'Loading...' : 'Try Again'}
 </button>
 </div>
 </div>
 </div>
 )
 }

 // Correct field mappings matching backend AiDebrief schema
 const overallScore = debrief.overallReadiness != null
 ? Math.round((debrief.overallReadiness / 10) * 100) : 0
 const scores = debrief.scores || {}
 const codeQuality = scores.codeQuality != null ? Math.round((scores.codeQuality / 5) * 100) : 0
 const problemSolving = scores.decomposition != null ? Math.round((scores.decomposition / 5) * 100) : 0
 const communication = scores.communication != null ? Math.round((scores.communication / 5) * 100) : 0
 const complexity = scores.complexity != null ? Math.round((scores.complexity / 5) * 100) : 0

 const whatWentWell = debrief.whatWentWell || []
 const areasToImprove = debrief.areasToImprove || []
 const studyNext = debrief.studyNext || []

 const hasScores = scores.codeQuality != null || scores.decomposition != null || scores.communication != null

 return (
 <div className="min-h-screen bg-bg-base">
 <Helmet>
 <title>Session Debrief | PeerCode</title>
 <meta name="description" content="Review your coding session performance and AI analysis" />
 </Helmet>
 <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-5">

 {/* Breadcrumb */}
 <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors group">
 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
 Back to Dashboard
 </Link>

 {/* Hero — Problem + Score */}
 <div className="relative overflow-hidden rounded-2xl border border-border-default bg-bg-surface p-6 sm:p-8">
 <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
 <div className="relative flex items-start justify-between flex-wrap gap-6">
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">Session Debrief</p>
 <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3 leading-tight">
 {debrief.problemTitle || 'Practice Session'}
 </h1>
 <div className="flex flex-wrap items-center gap-3">
 {debrief.problemDifficulty && (
 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
 debrief.problemDifficulty.toLowerCase() === 'easy'
 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
 : debrief.problemDifficulty.toLowerCase() === 'hard'
 ? 'bg-red-500/10 text-red-400 border-red-500/30'
 : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
 }`}>{debrief.problemDifficulty}</span>
 )}
 {debrief.sessionDate && (
 <span className="flex items-center gap-1.5 text-xs text-text-muted">
 <Clock className="w-3 h-3 text-indigo-400/60" />
 {new Date(debrief.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
 </span>
 )}
 {debrief.duration > 0 && (
 <span className="flex items-center gap-1.5 text-xs text-text-muted">
 <Zap className="w-3 h-3 text-amber-400/60" />
 {debrief.duration} min
 </span>
 )}
 </div>
 </div>
 <ScoreCircle value={overallScore} />
 </div>
 </div>

 {/* Tab Switcher */}
 <div className="flex gap-1 p-1 bg-bg-surface border border-border-default rounded-xl">
 {[
 { id: 'overview', label: 'Overview', icon: TrendingUp },
 { id: 'deep', label: 'Deep Analysis', icon: Brain },
 { id: 'plan', label: 'Improvement Plan', icon: Lightbulb },
 ].map(({ id, label, icon: Icon }) => (
 <button
 key={id}
 onClick={() => setActiveTab(id)}
 className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
 activeTab === id
 ? 'bg-indigo-600 text-text-primary shadow-lg shadow-indigo-600/20'
 : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.03]'
 }`}
 >
 <Icon className="w-4 h-4" />
 <span className="hidden sm:inline">{label}</span>
 </button>
 ))}
 </div>

 {activeTab === 'overview' && <>

 {/* Fallback retry banner */}
 {isFallback && (
 <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
 <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
 <p className="text-sm text-amber-300 flex-1">AI analysis was incomplete. Click regenerate for a full debrief.</p>
 <button
 onClick={regenerateDebrief}
 disabled={isRegenerating}
 className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-text-primary bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-all active:scale-[0.98]"
 >
 <RotateCcw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
 {isRegenerating ? 'Regenerating…' : 'Regenerate'}
 </button>
 </div>
 )}

 {/* Summary */}
 {debrief.summary && (
 <div className="relative bg-bg-surface border border-indigo-500/20 rounded-xl p-5 pl-6">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-xl" />
 <p className="text-sm text-text-secondary leading-relaxed">{debrief.summary}</p>
 </div>
 )}

 {/* Score Cards */}
 {hasScores && (
 <div>
 <div className="flex items-center gap-2 mb-3">
 <TrendingUp className="w-4 h-4 text-indigo-400" />
 <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Performance Breakdown</h2>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {scores.codeQuality != null && (
 <ScoreCard label="Code Quality" value={scores.codeQuality} max={5} color="#6d4df2" icon={Code2} />
 )}
 {scores.decomposition != null && (
 <ScoreCard label="Problem Solving" value={scores.decomposition} max={5} color="#22c55e" icon={Target} />
 )}
 {scores.communication != null && (
 <ScoreCard label="Communication" value={scores.communication} max={5} color="#f59e0b" icon={MessageSquare} />
 )}
 {scores.complexity != null && (
 <ScoreCard label="Complexity" value={scores.complexity} max={5} color="#a855f7" icon={Brain} />
 )}
 </div>
 </div>
 )}

 {/* Progress Bars */}
 {hasScores && (
 <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-2">
 <div className="flex items-center gap-2 mb-4">
 <Cpu className="w-4 h-4 text-indigo-400" />
 <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Skill Metrics</h2>
 </div>
 {scores.codeQuality != null && <MetricBar label="Code Quality" value={codeQuality} color="#6d4df2" icon={Code2} />}
 {scores.decomposition != null && <MetricBar label="Problem Decomposition" value={problemSolving} color="#22c55e" icon={Target} />}
 {scores.communication != null && <MetricBar label="Communication" value={communication} color="#f59e0b" icon={MessageSquare} />}
 {scores.complexity != null && <MetricBar label="Algorithm Complexity" value={complexity} color="#a855f7" icon={Brain} />}
 </div>
 )}

 {/* What Went Well + Areas to Improve */}
 <div className="grid md:grid-cols-2 gap-4">
 <div className="bg-bg-surface border border-border-default rounded-xl p-5">
 <div className="flex items-center gap-2.5 mb-4 pb-3.5 border-b border-border-default">
 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
 </div>
 <h3 className="text-sm font-bold text-text-primary">What Went Well</h3>
 {whatWentWell.length > 0 && (
 <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{whatWentWell.length}</span>
 )}
 </div>
 {whatWentWell.length > 0 ? (
 <ul className="space-y-3">
 {whatWentWell.map((s, i) => (
 <li key={i} className="flex items-start gap-3 group">
 <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5 group-hover:bg-emerald-500/20 transition-colors">
 <span className="text-[10px] text-emerald-400 font-bold">{i + 1}</span>
 </span>
 <span className="text-sm text-text-muted leading-relaxed group-hover:text-text-secondary transition-colors">{s}</span>
 </li>
 ))}
 </ul>
 ) : (
 <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
 <CheckCircle2 className="w-8 h-8 text-text-muted" />
 <p className="text-sm text-text-muted">No specific strengths recorded.</p>
 </div>
 )}
 </div>

 <div className="bg-bg-surface border border-border-default rounded-xl p-5">
 <div className="flex items-center gap-2.5 mb-4 pb-3.5 border-b border-border-default">
 <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
 <AlertTriangle className="w-4 h-4 text-amber-400" />
 </div>
 <h3 className="text-sm font-bold text-text-primary">Areas to Improve</h3>
 {areasToImprove.length > 0 && (
 <span className="ml-auto text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{areasToImprove.length}</span>
 )}
 </div>
 {areasToImprove.length > 0 ? (
 <ul className="space-y-3">
 {areasToImprove.map((item, i) => (
 <li key={i} className="flex items-start gap-3 group">
 <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mt-0.5 group-hover:bg-amber-500/20 transition-colors">
 <span className="text-[10px] text-amber-400 font-bold">{i + 1}</span>
 </span>
 <span className="text-sm text-text-muted leading-relaxed group-hover:text-text-secondary transition-colors">{item}</span>
 </li>
 ))}
 </ul>
 ) : (
 <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
 <AlertTriangle className="w-8 h-8 text-text-muted" />
 <p className="text-sm text-text-muted">No specific improvements recorded.</p>
 </div>
 )}
 </div>
 </div>

 {/* Weak Topics */}
 {debrief.weakTopics?.length > 0 && (
 <div className="bg-bg-surface border border-border-default rounded-xl p-5">
 <div className="flex items-center gap-2 mb-4">
 <Target className="w-4 h-4 text-red-400" />
 <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Focus Areas</h2>
 </div>
 <div className="flex flex-wrap gap-2">
 {debrief.weakTopics.map(t => (
 <span key={t} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all cursor-default">
 <AlertTriangle className="w-3 h-3" />
 {t}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Partner Rating */}
 {partner && !ratingSubmitted && (
 <div className="bg-bg-surface border border-border-default rounded-xl p-5">
 <div className="flex items-center gap-2 mb-4">
 <Star className="w-4 h-4 text-amber-400" />
 <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Rate Your Partner</h2>
 </div>
 <p className="text-sm text-text-muted mb-4">How was your collaboration experience?</p>
 <div className="flex items-center gap-1 mb-4">
 {[1, 2, 3, 4, 5].map(star => (
 <button
 key={star}
 type="button"
 aria-label={`Rate ${star} out of 5`}
 aria-pressed={rating === star}
 onClick={() => setRating(star)}
 onMouseEnter={() => setHoverRating(star)}
 onMouseLeave={() => setHoverRating(0)}
 onKeyDown={e => { if (e.key === 'ArrowRight') setRating(Math.min(5, star + 1)); else if (e.key === 'ArrowLeft') setRating(Math.max(1, star - 1)) }}
 className="transition-transform hover:scale-110 active:scale-95"
 >
 <Star
 className="w-8 h-8 transition-colors duration-150"
 fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
 stroke={(hoverRating || rating) >= star ? '#f59e0b' : '#374151'}
 />
 </button>
 ))}
 {rating > 0 && (
 <span className="ml-3 text-sm text-amber-400 font-medium">
 {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
 </span>
 )}
 </div>
 <textarea
 value={ratingFeedback}
 onChange={e => setRatingFeedback(e.target.value)}
 placeholder="Optional: share feedback about your partner's collaboration..."
 rows={2}
 maxLength={500}
 className="w-full px-3 py-2 bg-bg-surface border border-border-strong rounded-lg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 placeholder-text-muted resize-none mb-3 transition-colors"
 />
 <button
 onClick={async () => {
 if (!rating) { toast.error('Please select a star rating'); return }
 setRatingSubmitting(true)
 try {
 await submitPartnerRating({ sessionId: sessionMongoId || debrief.sessionId || debrief._id, toUserId: partner._id, score: rating, feedback: ratingFeedback })
 setRatingSubmitted(true)
 toast.success('Rating submitted — thanks!')
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to submit rating')
 } finally { setRatingSubmitting(false) }
 }}
 disabled={!rating || ratingSubmitting}
 className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-text-primary bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
 >
 {ratingSubmitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</> : 'Submit Rating'}
 </button>
 </div>
 )}
 {ratingSubmitted && (
 <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
 <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
 <p className="text-sm text-emerald-300 font-medium">Partner rating submitted. Thank you!</p>
 </div>
 )}

 </>}

 {/* Deep Analysis Tab */}
 {activeTab === 'deep' && <>
 {/* Complexity Analysis */}
 {(debrief.timeComplexity || debrief.spaceComplexity) && (
 <div className="bg-bg-surface border border-border-default rounded-xl p-5">
 <div className="flex items-center gap-2 mb-4">
 <Cpu className="w-4 h-4 text-cyan-400" />
 <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Complexity Analysis</h2>
 </div>
 <div className="grid sm:grid-cols-2 gap-4">
 {debrief.timeComplexity && (
 <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
 <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">Time Complexity</div>
 <p className="text-sm text-text-secondary">{debrief.timeComplexity}</p>
 </div>
 )}
 {debrief.spaceComplexity && (
 <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
 <div className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1">Space Complexity</div>
 <p className="text-sm text-text-secondary">{debrief.spaceComplexity}</p>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Approach Analysis */}
 {debrief.approachAnalysis && (
 <div className="bg-bg-surface border border-border-default rounded-xl p-5">
 <div className="flex items-center gap-2 mb-4">
 <GitBranch className="w-4 h-4 text-emerald-400" />
 <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Approach Analysis</h2>
 </div>
 <p className="text-sm text-text-secondary leading-relaxed">{debrief.approachAnalysis}</p>
 </div>
 )}

 {/* Interviewer Perspective */}
 {debrief.interviewerPerspective && (
 <div className="bg-bg-surface border border-amber-500/20 rounded-xl p-5">
 <div className="flex items-center gap-2 mb-4">
 <Eye className="w-4 h-4 text-amber-400" />
 <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Interviewer&apos;s Perspective</h2>
 </div>
 <div className="relative pl-4 border-l-2 border-amber-500/40">
 <p className="text-sm text-text-secondary leading-relaxed italic">&ldquo;{debrief.interviewerPerspective}&rdquo;</p>
 </div>
 </div>
 )}

 {/* Similar Problems */}
 {debrief.similarProblems?.length > 0 && (
 <div className="bg-bg-surface border border-border-default rounded-xl p-5">
 <div className="flex items-center gap-2 mb-4">
 <BookOpen className="w-4 h-4 text-indigo-400" />
 <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Similar Problems to Practice</h2>
 </div>
 <div className="space-y-3">
 {debrief.similarProblems.map((p, i) => (
 <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated/50 border border-border-subtle hover:bg-bg-hover/60 transition-colors group">
 <div className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded capitalize border ${
 p.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
 : p.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20'
 : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
 }`}>{p.difficulty}</div>
 <div className="flex-1 min-w-0">
 <div className="font-semibold text-sm text-text-primary truncate">{p.title}</div>
 <div className="text-xs text-text-muted mt-0.5">{p.reason}</div>
 </div>
 <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-indigo-400 transition-colors flex-shrink-0" />
 </div>
 ))}
 </div>
 </div>
 )}
 </>}

 {/* Improvement Plan Tab */}
 {activeTab === 'plan' && <>
 {debrief.improvementPlan?.length > 0 ? (
 <div className="bg-bg-surface border border-border-default rounded-xl p-5">
 <div className="flex items-center gap-2 mb-5">
 <Lightbulb className="w-4 h-4 text-amber-400" />
 <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Your Personalized Improvement Plan</h2>
 </div>
 <div className="space-y-4">
 {debrief.improvementPlan.map((step, i) => (
 <div key={i} className="flex gap-4 group">
 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-text-primary text-sm font-bold shadow-lg shadow-indigo-600/20">
 {i + 1}
 </div>
 <div className="flex-1 pt-1">
 <p className="text-sm text-text-secondary leading-relaxed group-hover:text-text-primary transition-colors">{step}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <div className="bg-bg-surface border border-border-default rounded-xl p-8 text-center">
 <Lightbulb className="w-10 h-10 text-text-muted mx-auto mb-3" />
 <p className="text-text-muted text-sm">No improvement plan available for this session.</p>
 </div>
 )}

 {/* Study Next inside plan tab */}
 {debrief.studyNext?.length > 0 && (
 <div className="bg-bg-surface border border-border-default rounded-xl p-5">
 <div className="flex items-center gap-2 mb-4">
 <BookOpen className="w-4 h-4 text-amber-400" />
 <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Topics to Study Next</h2>
 </div>
 <div className="grid gap-3">
 {debrief.studyNext.map((tip, i) => (
 <div key={i} className="group flex items-start gap-3 bg-bg-elevated/50 hover:bg-bg-hover/60 rounded-xl p-4 border border-border-subtle transition-all">
 <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">{i + 1}</span>
 <p className="text-sm text-text-muted leading-relaxed pt-1 group-hover:text-text-secondary transition-colors">{tip}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </>}

 {/* Actions */}
 <div className="flex items-center gap-3 pt-2 flex-wrap">
 {debrief.problemSlug && (
 <Link
 to={`/problems/${debrief.problemSlug}`}
 className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-text-primary bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all active:scale-[0.98]"
 >
 <RotateCcw className="w-4 h-4" />
 Solve Again
 </Link>
 )}
 <button
 onClick={() => {
 const url = window.location.href
 if (navigator.share) {
 navigator.share({ title: `Debrief: ${debrief.problemTitle || 'Practice Session'}`, url }).catch(() => {})
 } else {
 navigator.clipboard.writeText(url).then(() => toast.success('Link copied to clipboard!'))
 }
 }}
 className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-text-muted hover:text-text-primary bg-bg-overlay/30 hover:bg-bg-overlay/50 border border-border-default hover:border-border-strong transition-all active:scale-[0.98]"
 >
 <Share2 className="w-4 h-4" />
 Share
 </button>
 <Link
 to="/dashboard"
 className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-text-muted hover:text-text-primary bg-bg-overlay/30 hover:bg-bg-overlay/50 border border-border-default hover:border-border-strong transition-all active:scale-[0.98]"
 >
 <ArrowLeft className="w-4 h-4" />
 Dashboard
 </Link>
 </div>
 </div>
 </div>
 )
}
