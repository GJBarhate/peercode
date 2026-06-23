import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Clock, CheckCircle2, Circle, Medal, Users, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import ErrorState from '../components/common/ErrorState'
import Skeleton from '../components/common/Skeleton'
import { getContest, joinContest } from '../services/api'
import { useAuth } from '../context/AuthContext'

const DIFF_BADGE = {
  easy: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  hard: 'bg-red-500/15 text-red-500 border-red-500/30',
}

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(targetDate).getTime() - Date.now()))
  useEffect(() => {
    const interval = setInterval(() => setRemaining(Math.max(0, new Date(targetDate).getTime() - Date.now())), 1000)
    return () => clearInterval(interval)
  }, [targetDate])
  const totalSec = Math.floor(remaining / 1000)
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    isOver: remaining <= 0,
  }
}

export default function ContestDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [contest, setContest] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [myParticipation, setMyParticipation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await getContest(slug)
      setContest(data.contest)
      setLeaderboard(data.leaderboard || [])
      setMyParticipation(data.myParticipation)
    } catch (err) {
      setError(err.response?.data?.message || 'Contest not found')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  // Refresh leaderboard periodically while the contest is live.
  useEffect(() => {
    if (contest?.status !== 'active') return
    const interval = setInterval(load, 20000)
    return () => clearInterval(interval)
  }, [contest?.status, load])

  const countdown = useCountdown(contest?.status === 'active' ? contest.endTime : contest?.startTime)

  const handleJoin = async () => {
    setIsJoining(true)
    try {
      await joinContest(slug)
      toast.success('Joined the contest — good luck!')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join contest')
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </main>
      </div>
    )
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen bg-bg-base">
        <ErrorState error={error || 'Contest not found'} title="Failed to Load Contest" onRetry={load} onGoHome={() => navigate('/contests')} />
      </div>
    )
  }

  const hasJoined = !!myParticipation
  const isActive = contest.status === 'active'
  const isUpcoming = contest.status === 'upcoming'
  const isCompleted = contest.status === 'completed'
  const solvedIds = new Set((myParticipation?.solvedProblems || []).map(s => s.problem?.toString?.() || s.problem))

  return (
    <div className="min-h-screen bg-bg-base">
      <Helmet>
        <title>{contest.title} — PeerCode Contests</title>
      </Helmet>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <Link to="/contests" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> All Contests
        </Link>

        <div className="rounded-2xl border border-border-default bg-gradient-to-br from-amber-500/[0.06] to-bg-surface p-6 sm:p-8 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
                <Trophy className="w-3.5 h-3.5" /> {contest.dayOfWeek === 'sunday' ? 'Sunday Contest' : 'Wednesday Contest'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{contest.title}</h1>
            </div>
            {isActive && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold uppercase tracking-wide flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
              </span>
            )}
            {isCompleted && (
              <span className="px-3 py-1.5 rounded-full bg-bg-overlay text-text-muted text-xs font-bold uppercase tracking-wide flex-shrink-0">Ended</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {!countdown.isOver && !isCompleted && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-muted">{isActive ? 'Ends in' : 'Starts in'}</span>
                <span className="text-lg font-bold text-text-primary tabular-nums">
                  {countdown.days > 0 && `${countdown.days}d `}
                  {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Users className="w-4 h-4" /> {leaderboard.length} participants
            </div>
            {myParticipation && (
              <>
              <div className="flex items-center gap-2 text-sm">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-text-muted">Your rank:</span>
                <span className="font-bold text-accent">#{myParticipation.rank || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-muted">Score:</span>
                <span className="font-bold text-text-primary">{myParticipation.score}</span>
              </div>
              </>
            )}
          </div>

          {!hasJoined && !isCompleted && user && (
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="mt-5 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
            >
              {isJoining ? 'Joining...' : 'Join Contest'}
            </button>
          )}
          {!user && (
            <Link to="/?register=1" className="inline-block mt-5 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
              Sign up to compete
            </Link>
          )}
        </div>

        {/* Your Result Banner — shown after contest ends */}
        {isCompleted && myParticipation && (
          <div className="mb-8 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 to-bg-surface p-6 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-widest">Final Rank</p>
                <p className="text-3xl font-black text-text-primary">#{myParticipation.rank || myParticipation.finalRank || '—'}</p>
              </div>
            </div>
            <div className="h-12 w-px bg-border-default hidden sm:block" />
            <div>
              <p className="text-xs text-text-muted mb-0.5">Score</p>
              <p className="text-xl font-bold text-text-primary">{myParticipation.score}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Problems Solved</p>
              <p className="text-xl font-bold text-text-primary">{myParticipation.solvedProblems?.length || 0} / {contest.problems?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Total Participants</p>
              <p className="text-xl font-bold text-text-primary">{leaderboard.length}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Problems */}
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-4">Problems</h2>
            <div className="space-y-2.5">
              {(contest.problems || []).map((problem, i) => {
                const solved = solvedIds.has(problem._id?.toString?.() || problem._id)
                const canSolve = hasJoined && isActive
                const ProblemWrapper = canSolve ? Link : 'div'
                const wrapperProps = canSolve ? { to: `/problems/${problem.slug}?contest=${contest.slug}` } : {}
                return (
                  <ProblemWrapper
                    key={problem._id}
                    {...wrapperProps}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      canSolve ? 'border-border-default bg-bg-surface hover:border-accent/40 cursor-pointer' : 'border-border-default bg-bg-surface opacity-80'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center text-sm font-bold text-text-muted flex-shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {solved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-text-muted flex-shrink-0" />
                    )}
                    <span className="flex-1 text-sm font-medium text-text-primary">{problem.title}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md border capitalize ${DIFF_BADGE[problem.difficulty] || ''}`}>
                      {problem.difficulty}
                    </span>
                  </ProblemWrapper>
                )
              })}
            </div>
            {isUpcoming && (
              <p className="text-sm text-text-muted mt-4">Problems unlock once the contest goes live at the scheduled start time.</p>
            )}
            {!hasJoined && isActive && (
              <p className="text-sm text-text-muted mt-4">Join the contest above to start solving and appear on the leaderboard.</p>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-4">
              Leaderboard
              {isActive && <span className="ml-2 text-xs font-normal text-emerald-400">(Live)</span>}
            </h2>
            <div className="rounded-xl border border-border-default bg-bg-surface divide-y divide-border-default overflow-hidden">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-text-muted p-4">No participants yet — be the first to join!</p>
              ) : (
                <>
                {leaderboard.slice(0, 20).map(entry => {
                  const isMe = user && entry.user?._id === (user._id || user.id)
                  return (
                  <div key={entry.user?._id || entry.rank} className={`flex items-center gap-3 p-3 transition-colors ${isMe ? 'bg-accent/10 border-l-2 border-accent' : ''}`}>
                    <span className={`w-6 text-center text-sm font-bold flex-shrink-0 ${
                      entry.rank === 1 ? 'text-amber-400' : entry.rank === 2 ? 'text-gray-300' : entry.rank === 3 ? 'text-orange-400' : 'text-text-muted'
                    }`}>
                      {entry.rank <= 3 ? <Medal className="w-4 h-4 inline" /> : entry.rank}
                    </span>
                    <span className={`flex-1 text-sm font-medium truncate ${isMe ? 'text-accent' : 'text-text-primary'}`}>
                      {entry.user?.username || 'Unknown'}
                      {isMe && <span className="text-[10px] text-accent ml-1">(you)</span>}
                    </span>
                    <span className="text-xs text-text-muted mr-1">{entry.solvedCount} solved</span>
                    <span className="text-sm font-bold text-text-secondary">{entry.score}</span>
                  </div>
                  )
                })}
                {/* Show user's row if they're outside top 20 */}
                {myParticipation && myParticipation.rank > 20 && (
                  <>
                  <div className="p-1.5 text-center text-xs text-text-muted">···</div>
                  <div className="flex items-center gap-3 p-3 bg-accent/10 border-l-2 border-accent">
                    <span className="w-6 text-center text-sm font-bold text-accent flex-shrink-0">
                      {myParticipation.rank}
                    </span>
                    <span className="flex-1 text-sm font-medium text-accent truncate">
                      {user?.username || 'You'} <span className="text-[10px]">(you)</span>
                    </span>
                    <span className="text-sm font-bold text-text-secondary">{myParticipation.score}</span>
                  </div>
                  </>
                )}
                </>
              )}
            </div>
            {leaderboard.length > 20 && (
              <p className="text-xs text-text-muted mt-2 text-center">Showing top 20 of {leaderboard.length} participants</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
