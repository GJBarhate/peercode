import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useParams } from 'react-router-dom'
import { Lock, Users, Link2, Copy, ArrowRight, Shuffle, Check } from 'lucide-react'
import { createPrivateRoom, joinPrivateRoom } from '../services/api'
import toast from 'react-hot-toast'

const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function PrivateRoomPage() {
 const navigate = useNavigate()
 const { inviteCode: paramCode } = useParams()
 const [mode, setMode] = useState(paramCode ? 'join' : 'create')
 const [difficulty, setDifficulty] = useState('medium')
 const [isRanked, setIsRanked] = useState(true)
 const [customTimeLimit, setCustomTimeLimit] = useState('')
 const [createdRoom, setCreatedRoom] = useState(null)
 const [inviteCode, setInviteCode] = useState(paramCode?.toUpperCase() || '')
 const [isLoading, setIsLoading] = useState(false)
 const [copied, setCopied] = useState(false)

 const handleCreate = async () => {
 setIsLoading(true)
 try {
 const { data } = await createPrivateRoom({
 difficulty,
 isRanked,
 customTimeLimit: customTimeLimit ? parseInt(customTimeLimit) * 60 : undefined,
 })
 setCreatedRoom(data)
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to create room')
 } finally {
 setIsLoading(false)
 }
 }

 const handleJoin = async () => {
 const code = inviteCode.trim().toUpperCase()
 if (code.length !== 6) {
 toast.error('Enter a valid 6-character invite code')
 return
 }
 setIsLoading(true)
 try {
 const { data } = await joinPrivateRoom(code)
 navigate(`/room/${data.roomId}`)
 } catch (err) {
 toast.error(err.response?.data?.message || 'Invalid or expired invite code')
 } finally {
 setIsLoading(false)
 }
 }

 const handleCopy = () => {
 const link = `${window.location.origin}/room/join/${createdRoom?.inviteCode}`
 navigator.clipboard.writeText(link).then(() => {
 setCopied(true)
 setTimeout(() => setCopied(false), 2000)
 }).catch(() => toast.error('Could not copy'))
 }

 return (
 <div className="min-h-screen bg-bg-base text-text-primary">
 <Helmet>
 <title>Private Room | PeerCode</title>
 <meta name="description" content="Create or join a private coding room with a friend." />
 </Helmet>
 <div className="max-w-lg mx-auto px-4 pt-6 pb-16">
 <div className="flex items-center gap-3 mb-8">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
 <Lock className="w-5 h-5 text-white" />
 </div>
 <div>
 <h1 className="text-2xl font-black text-text-primary">Private Room</h1>
 <p className="text-sm text-text-muted">Practice with a specific friend</p>
 </div>
 </div>

 <div className="flex gap-1 mb-6 bg-bg-surface border border-border-default rounded-xl p-1">
 {[{ key: 'create', label: 'Create Room' }, { key: 'join', label: 'Join Room' }].map(({ key, label }) => (
 <button
 key={key}
 onClick={() => { setMode(key); setCreatedRoom(null) }}
 className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
 mode === key ? 'bg-indigo-600 text-white' : 'text-text-muted hover:text-text-primary'
 }`}
 >
 {label}
 </button>
 ))}
 </div>

 {mode === 'create' ? (
 <div className="bg-bg-surface border border-border-default rounded-2xl p-6 space-y-5">
 {!createdRoom ? (
 <>
 <div>
 <label className="block text-sm font-medium text-text-secondary mb-2">Difficulty</label>
 <div className="grid grid-cols-3 gap-2">
 {DIFFICULTIES.map(d => (
 <button
 key={d}
 onClick={() => setDifficulty(d)}
 className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors border ${
 difficulty === d
 ? d === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30'
 : d === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
 : 'bg-red-500/20 text-red-400 border-red-500/30'
 : 'bg-bg-elevated text-text-muted border-border-strong hover:border-border-strong'
 }`}
 >
 {d}
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-text-secondary mb-2">Time Limit (minutes)</label>
 <input
 type="number"
 value={customTimeLimit}
 onChange={e => setCustomTimeLimit(e.target.value)}
 placeholder="Default (45 min)"
 min={5}
 max={120}
 className="w-full bg-bg-elevated border border-border-strong rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
 />
 </div>

 <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl">
 <div>
 <div className="text-sm font-medium text-text-primary">Ranked Match</div>
 <div className="text-xs text-text-muted">ELO affected by result</div>
 </div>
 <button
 onClick={() => setIsRanked(v => !v)}
 className={`relative w-11 h-6 rounded-full transition-colors ${isRanked ? 'bg-indigo-600' : 'bg-bg-overlay'}`}
 >
 <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-bg-surface transition-transform ${isRanked ? 'translate-x-5' : 'translate-x-0'}`} />
 </button>
 </div>

 <button
 onClick={handleCreate}
 disabled={isLoading}
 className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
 >
 {isLoading ? <Shuffle className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
 Create Private Room
 </button>
 </>
 ) : (
 <div className="space-y-4 text-center">
 <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center">
 <Check className="w-8 h-8 text-green-400" />
 </div>
 <h2 className="text-xl font-bold text-text-primary">Room Created!</h2>
 <p className="text-text-muted text-sm">Share this invite code with your friend</p>

 <div className="bg-bg-elevated border border-border-strong rounded-xl p-4">
 <div className="text-3xl font-black tracking-[0.25em] text-indigo-400 mb-1">
 {createdRoom.inviteCode}
 </div>
 <p className="text-xs text-text-muted">6-character code</p>
 </div>

 <button
 onClick={handleCopy}
 className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-bg-elevated hover:bg-bg-overlay border border-border-strong text-text-primary transition-colors"
 >
 {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
 {copied ? 'Copied!' : 'Copy invite link'}
 </button>

 <button
 onClick={() => navigate(`/room/${createdRoom.roomId}`)}
 className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
 >
 Enter Room
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 )}
 </div>
 ) : (
 <div className="bg-bg-surface border border-border-default rounded-2xl p-6 space-y-5">
 <div>
 <label className="block text-sm font-medium text-text-secondary mb-2">Invite Code</label>
 <input
 type="text"
 value={inviteCode}
 onChange={e => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
 placeholder="ABCDEF"
 maxLength={6}
 className="w-full bg-bg-elevated border border-border-strong rounded-xl px-4 py-3 text-2xl font-black tracking-[0.3em] text-center text-indigo-400 placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
 onKeyDown={e => { if (e.key === 'Enter') handleJoin() }}
 />
 </div>
 <button
 onClick={handleJoin}
 disabled={isLoading || inviteCode.length !== 6}
 className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
 >
 {isLoading ? <Shuffle className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
 Join Room
 </button>
 </div>
 )}
 </div>
 </div>
 )
}
