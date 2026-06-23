import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Brain, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'

const difficultyStyle = {
 easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
 medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
 hard: 'bg-red-500/10 text-red-400 border-red-500/20',
}

function RecommendCard({ item, index }) {
 const { problem, reason, weaknessScore } = item
 if (!problem) return null
 const diff = problem.difficulty?.toLowerCase()

 return (
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.07 }}
 className="group relative"
 >
 <Link
 to={`/problems/${problem.slug || problem._id}`}
 className="flex flex-col gap-3 p-4 rounded-xl border border-border-default bg-bg-surface hover:border-indigo-500/40 hover:bg-bg-elevated/60 transition-all duration-200"
 >
 <div className="flex items-start justify-between gap-2">
 <h4 className="font-semibold text-text-primary text-sm leading-tight group-hover:text-indigo-300 transition-colors line-clamp-2">
 {problem.title}
 </h4>
 <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border capitalize ${difficultyStyle[diff] || 'bg-bg-overlay text-text-muted border-border-strong'}`}>
 {problem.difficulty}
 </span>
 </div>

 {problem.tags?.length > 0 && (
 <div className="flex flex-wrap gap-1">
 {problem.tags.slice(0, 3).map(t => (
 <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted border border-border-strong">
 {t}
 </span>
 ))}
 </div>
 )}

 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-xs text-indigo-400">
 <Brain className="w-3 h-3 flex-shrink-0" />
 <span className="line-clamp-1">{reason}</span>
 </div>
 <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
 </div>

 {weaknessScore > 0 && (
 <div className="flex items-center gap-2">
 <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
 <div
 className="h-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
 style={{ width: `${Math.min(100, weaknessScore * 50)}%` }}
 />
 </div>
 <span className="text-[10px] text-text-muted">focus area</span>
 </div>
 )}
 </Link>
 </motion.div>
 )
}

export default function ForYouSection() {
 const [recommendations, setRecommendations] = useState([])
 const [isLoading, setIsLoading] = useState(true)
 const [error, setError] = useState(null)

 useEffect(() => {
 api.get('/problems/recommended')
 .then(res => setRecommendations(res.data?.recommendations || []))
 .catch(() => setError(true))
 .finally(() => setIsLoading(false))
 }, [])

 if (error) return null

 return (
 <div className="rounded-xl border border-border-default bg-bg-surface/50 p-5">
 <div className="flex items-center gap-2 mb-4">
 <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center">
 <Sparkles className="w-4 h-4 text-indigo-400" />
 </div>
 <h3 className="font-bold text-text-primary">For You</h3>
 <span className="text-xs text-text-muted ml-1">AI-curated based on your weak areas</span>
 <div className="ml-auto flex items-center gap-1 text-xs text-indigo-400">
 <TrendingUp className="w-3 h-3" />
 <span>Personalized</span>
 </div>
 </div>

 {isLoading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="h-32 rounded-xl bg-bg-elevated/50 animate-pulse" />
 ))}
 </div>
 ) : recommendations.length === 0 ? (
 <div className="text-center py-8 text-text-muted text-sm">
 Solve some problems to get personalized recommendations
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
 <AnimatePresence>
 {recommendations.map((item, i) => (
 <RecommendCard key={item.problem?._id || i} item={item} index={i} />
 ))}
 </AnimatePresence>
 </div>
 )}
 </div>
 )
}
