import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import Joyride from 'react-joyride'
import { Link } from 'react-router-dom'
import { Trophy, Clock, Calendar, Users, ChevronRight, History, Medal, Zap } from 'lucide-react'
import ErrorState from '../components/common/ErrorState'
import Skeleton from '../components/common/Skeleton'
import { getContests, getContestHistory } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useOnboardingTour, contestsSteps } from '../hooks/useOnboardingTour'

const DIFF_DOT = { easy: 'bg-emerald-500', medium: 'bg-amber-500', hard: 'bg-red-500' }

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(targetDate).getTime() - Date.now()))
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, new Date(targetDate).getTime() - Date.now()))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])
  const totalSec = Math.floor(remaining / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { days, hours, minutes, seconds, isOver: remaining <= 0 }
}

function CountdownChip({ targetDate, label }) {
  const { days, hours, minutes, seconds, isOver } = useCountdown(targetDate)
  if (isOver) return null
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
      <Clock className="w-3.5 h-3.5 text-accent" />
      {label}
      <span className="tabular-nums text-text-primary">
        {days > 0 && `${days}d `}{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}

function ContestCard({ contest }) {
  const isLive = contest.status === 'active'
  return (
    <Link
      to={`/contests/${contest.slug}`}
      className={`relative block rounded-2xl border p-6 transition-all duration-300 group overflow-hidden ${
        isLive
          ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-bg-surface shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20'
          : 'border-border-default bg-bg-surface hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5'
      }`}
    >
      {isLive && (
        <span className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live Now
        </span>
      )}
      <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
        <Calendar className="w-3.5 h-3.5" />
        {contest.dayOfWeek === 'sunday' ? 'Sunday Contest' : 'Wednesday Contest'}
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-accent transition-colors">{contest.title}</h3>
      <div className="flex items-center gap-2 mb-4">
        {(contest.problems || []).map((p, i) => (
          <span key={p._id || i} className={`w-2.5 h-2.5 rounded-full ${DIFF_DOT[p.difficulty] || 'bg-bg-overlay'}`} title={p.title} />
        ))}
        <span className="text-xs text-text-muted ml-1">{(contest.problems || []).length} problems</span>
      </div>
      <div className="flex items-center justify-between">
        {isLive ? (
          <CountdownChip targetDate={contest.endTime} label="Ends in" />
        ) : (
          <CountdownChip targetDate={contest.startTime} label="Starts in" />
        )}
        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  )
}

function HistoryRow({ entry }) {
  const medalColor = entry.myRank === 1 ? 'text-amber-400' : entry.myRank === 2 ? 'text-gray-300' : entry.myRank === 3 ? 'text-orange-400' : 'text-text-muted'
  return (
    <Link
      to={`/contests/${entry.slug}`}
      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border-default bg-bg-surface hover:border-border-strong transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{entry.title}</p>
        <p className="text-xs text-text-muted mt-0.5">{new Date(entry.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>
      <div className="flex items-center gap-5 flex-shrink-0">
        <div className="text-center">
          <p className="text-xs text-text-muted">Solved</p>
          <p className="text-sm font-bold text-text-primary">{entry.mySolvedCount}/4</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-text-muted">Score</p>
          <p className="text-sm font-bold text-text-primary">{entry.myScore}</p>
        </div>
        <div className="flex items-center gap-1 text-center min-w-[3rem]">
          <Medal className={`w-4 h-4 ${medalColor}`} />
          <p className={`text-sm font-bold ${medalColor}`}>#{entry.myRank ?? '—'}</p>
        </div>
      </div>
    </Link>
  )
}

export default function ContestsPage() {
  const { user } = useAuth()
  const { run: tourRun, completeTour } = useOnboardingTour('contests')
  const [upcoming, setUpcoming] = useState([])
  const [past, setPast] = useState([])
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHistory, setShowHistory] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await getContests()
      setUpcoming(data.upcoming || [])
      setPast(data.past || [])
      if (user) {
        try {
          const { data: historyData } = await getContestHistory()
          setHistory(historyData || [])
        } catch { /* history is best-effort */ }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load contests')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  if (error) {
    return <ErrorState error={error} title="Failed to Load Contests" onRetry={load} />
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <Helmet>
        <title>Contests — PeerCode</title>
        <meta name="description" content="Weekly coding contests every Sunday and Wednesday — compete on 4 fresh problems and climb the leaderboard." />
      </Helmet>
      <Joyride
        steps={contestsSteps}
        run={tourRun}
        continuous
        showSkipButton
        showProgress
        callback={(data) => { if (data.status === 'finished' || data.status === 'skipped') completeTour() }}
        styles={{ options: { zIndex: 10000, primaryColor: '#6d4df2', backgroundColor: '#1a1a2e', textColor: '#e2e8f0', arrowColor: '#1a1a2e' }, tooltip: { borderRadius: 12, padding: '20px' } }}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Weekly Contests</h1>
        </div>
        <p className="text-text-muted mb-8">
          Every <span className="text-text-secondary font-medium">Sunday</span> and <span className="text-text-secondary font-medium">Wednesday</span>, 8:00 – 9:30 PM IST &middot; 4 fresh problems &middot; live leaderboard
        </p>

        <div data-tour="contests-upcoming">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-4">
          <Zap className="w-4 h-4 text-accent" /> Upcoming & Live Contests
        </h2>
        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-5 mb-12">
            {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border-strong bg-bg-surface mb-12">
            <Calendar className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted mb-2">No contests scheduled right now</p>
            <p className="text-xs text-text-muted">Contests run every <span className="text-text-secondary font-medium">Sunday</span> and <span className="text-text-secondary font-medium">Wednesday</span> at 8:00 PM IST</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5 mb-12">
            {upcoming.map(contest => <ContestCard key={contest._id} contest={contest} />)}
          </div>
        )}
        </div>

        {user && history.length > 0 && (
          <div data-tour="contests-history">
            <button
              onClick={() => setShowHistory(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-4"
            >
              <History className="w-4 h-4" />
              Your Contest History
              <ChevronRight className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
            </button>
            {showHistory && (
              <div className="space-y-2.5">
                {history.map(entry => <HistoryRow key={entry._id} entry={entry} />)}
              </div>
            )}
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-12">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-4">
              <Users className="w-4 h-4" /> Recent Contests
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {past.slice(0, 6).map(contest => (
                <Link
                  key={contest._id}
                  to={`/contests/${contest.slug}`}
                  className="p-4 rounded-xl border border-border-default bg-bg-surface hover:border-border-strong transition-colors"
                >
                  <p className="text-sm font-semibold text-text-primary truncate">{contest.title}</p>
                  <p className="text-xs text-text-muted mt-1">{contest.participantCount} participants</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
