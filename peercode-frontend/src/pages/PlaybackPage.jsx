import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Play, ExternalLink } from 'lucide-react'
import ErrorState from '../components/common/ErrorState'
import PlaybackPlayer from '../components/playback/PlaybackPlayer'
import PlaybackTimeline from '../components/playback/PlaybackTimeline'
import SessionAnalytics from '../components/playback/SessionAnalytics'
import Skeleton from '../components/common/Skeleton'
import { getPlayback } from '../services/api'

export default function PlaybackPage() {
 const { roomId } = useParams()
 const navigate = useNavigate()
 const [snapshots, setSnapshots] = useState([])
 const [currentIndex, setCurrentIndex] = useState(0)
 const [isLoading, setIsLoading] = useState(true)
 const [error, setError] = useState(null)
 const [activeTab, setActiveTab] = useState('replay')
 const [problemSnapshot, setProblemSnapshot] = useState(null)

 const handleRetry = async () => {
 setError(null)
 setIsLoading(true)
 try {
 const { data } = await getPlayback(roomId)
 setSnapshots(data.snapshots || data || [])
 if (data.problemSnapshot) setProblemSnapshot(data.problemSnapshot)
 } catch (err) {
 setError(err.response?.data?.message || 'Failed to load playback')
 } finally {
 setIsLoading(false)
 }
 }

 useEffect(() => {
 async function load() {
 setIsLoading(true)
 try {
 const { data } = await getPlayback(roomId)
 setSnapshots(data.snapshots || data || [])
 if (data.problemSnapshot) setProblemSnapshot(data.problemSnapshot)
 } catch (err) {
 setError(err.response?.data?.message || 'Failed to load playback')
 } finally {
 setIsLoading(false)
 }
 }
 load()
 }, [roomId])

 if (error) {
 return (
 <div className="min-h-screen bg-bg-base">
 <ErrorState
 error={error}
 title="Failed to Load Playback"
 onRetry={handleRetry}
 onGoHome={() => navigate('/dashboard')}
 />
 </div>
 )
 }

 if (isLoading) {
 return (
 <div className="min-h-screen bg-bg-base">
 <div className="max-w-6xl mx-auto px-4 pt-6 pb-16 space-y-4">
 <Skeleton className="h-10 w-48" />
 <Skeleton className="h-[500px] w-full" />
 <Skeleton className="h-24 w-full" />
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-bg-base">
 <Helmet>
 <title>Session Playback | PeerCode</title>
 <meta name="description" content="Replay your coding session" />
 </Helmet>
 <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-16">
 <div className="flex items-center gap-3 mb-6">
 <Link
 to="/dashboard"
 className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
 >
 <ArrowLeft className="w-4 h-4" />
 Dashboard
 </Link>
 <span className="text-text-muted">/</span>
 <h1 className="text-xl font-bold text-text-primary">
 {problemSnapshot?.title ? `${problemSnapshot.title} — Playback` : 'Session Playback'}
 </h1>
 {problemSnapshot?.difficulty && (
 <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize border ${
 problemSnapshot.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
 : problemSnapshot.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20'
 : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
 }`}>{problemSnapshot.difficulty}</span>
 )}
 <div className="ml-auto">
 <Link
 to={`/debrief/${roomId}`}
 className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
 >
 <ExternalLink className="w-4 h-4" />
 View AI Debrief
 </Link>
 </div>
 </div>

 <div className="flex gap-1 mb-6 bg-bg-surface border border-border-default rounded-xl p-1 w-fit">
 {[
 { id: 'replay', label: 'Replay', icon: Play },
 { id: 'analytics', label: 'Analytics', icon: BarChart3 }
 ].map(({ id, label, icon: Icon }) => (
 <button
 key={id}
 onClick={() => setActiveTab(id)}
 className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
 activeTab === id
 ? 'bg-indigo-600 text-white'
 : 'text-text-muted hover:text-text-primary'
 }`}
 >
 <Icon className="w-4 h-4" />
 {label}
 </button>
 ))}
 </div>

 {activeTab === 'replay' && (
 <div className="space-y-4">
 {snapshots.length === 0 ? (
 <div className="bg-bg-surface border border-border-default rounded-2xl p-16 text-center">
 <p className="text-text-muted">No snapshots available for this session.</p>
 </div>
 ) : (
 <>
 <div className="h-[500px]">
 <PlaybackPlayer
 snapshots={snapshots}
 currentIndex={currentIndex}
 />
 </div>
 <PlaybackTimeline
 snapshots={snapshots}
 currentIndex={currentIndex}
 onChange={setCurrentIndex}
 />
 </>
 )}
 </div>
 )}

 {activeTab === 'analytics' && (
 <SessionAnalytics roomId={roomId} />
 )}
 </div>
 </div>
 )
}
