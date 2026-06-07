import { useEffect, useMemo, useState } from 'react'
import { Award, CalendarDays, Crown, Flame, Gem, KeyRound, Lock, Save, ShieldCheck, Star, Trophy, User, Zap } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import ErrorState from '../components/common/ErrorState'
import GeminiKeyManager from '../components/gemini/GeminiKeyManager'
import Skeleton from '../components/common/Skeleton'
import { changePassword, getErrorMessage, getProfile, updateProfile, getSubscriptionStatus } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const ACHIEVEMENTS = [
  { id: 'first_session', label: 'First Session', desc: 'Complete one interview session', icon: Award, req: s => s >= 1 },
  { id: 'week_warrior', label: 'Week Warrior', desc: 'Build a 7-day streak', icon: Flame, req: (_, streak) => streak >= 7 },
  { id: 'rising_star', label: 'Rising Star', desc: 'Reach ELO 1300', icon: Star, req: (__, ___, elo) => elo >= 1300 },
  { id: 'expert', label: 'Expert', desc: 'Reach ELO 1500', icon: ShieldCheck, req: (__, ___, elo) => elo >= 1500 },
  { id: 'master', label: 'Master', desc: 'Reach ELO 1700', icon: Gem, req: (__, ___, elo) => elo >= 1700 },
]

function formatDay(date) {
  return date.toISOString().slice(0, 10)
}

function buildActivityGrid(activityCounts) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  const offset = start.getDay()
  start.setDate(start.getDate() - offset)

  return Array.from({ length: 53 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(start)
      date.setDate(start.getDate() + weekIndex * 7 + dayIndex)
      const key = formatDay(date)
      return {
        key,
        date,
        count: activityCounts[key] || 0,
        outsideRange: date > today || key < formatDay(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())),
      }
    })
  )
}

function activityTone(count, outsideRange) {
  if (outsideRange) return 'bg-transparent'
  if (count >= 4) return 'bg-emerald-400'
  if (count >= 2) return 'bg-emerald-600'
  if (count >= 1) return 'bg-emerald-800'
  return 'bg-gray-800'
}

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({ username: '', email: '' })
  const [error, setError] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const [profileRes, subRes] = await Promise.all([getProfile(), getSubscriptionStatus()])
      setProfile(profileRes.data)
      setSubscription(subRes.data || { plan: 'free', status: 'active', usage: { hintsUsed: 0, analyzesUsed: 0 } })
      setEditForm({ username: profileRes.data.username || '', email: profileRes.data.email || '' })
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load profile'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data } = await updateProfile(editForm)
      setProfile(data)
      setUser(prev => ({ ...prev, ...data }))
      toast.success('Profile updated')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Update failed'))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setIsChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword, confirmPassword)
      toast.success('Password updated successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to change password'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const elo = profile?.elo || 1200
  const sessions = profile?.totalSessions || 0
  const streak = profile?.currentStreak || profile?.streakData?.currentStreak || 0
  const longestStreak = profile?.longestStreak || profile?.streakData?.longestStreak || 0
  const activityCounts = profile?.activityCounts || {}
  const activeDays = profile?.activeDays || Object.keys(activityCounts).length
  const totalActivity = Object.values(activityCounts).reduce((sum, count) => sum + count, 0)
  const activityGrid = useMemo(() => buildActivityGrid(activityCounts), [activityCounts])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <ErrorState
          error={error}
          title="Failed to Load Profile"
          onRetry={load}
          onGoHome={() => navigate('/dashboard')}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                {profile?.username?.[0]?.toUpperCase() || <User className="w-8 h-8" />}
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-gray-100 truncate">{profile?.username}</h1>
                <p className="text-gray-500 text-sm break-all">{profile?.email}</p>
                <p className="text-indigo-300 text-sm font-semibold mt-1">ELO {elo}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={event => setEditForm(prev => ({ ...prev, username: event.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  disabled
                  className="input-field opacity-70 cursor-not-allowed"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <h2 className="font-semibold text-gray-200">Change Password</h2>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                className="input-field w-full"
                required
              />
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                className="input-field w-full"
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                className="input-field w-full"
                required
              />
              <button
                onClick={handlePasswordChange}
                disabled={isChangingPassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <Flame className="w-5 h-5 text-orange-400" />
              <h2 className="font-semibold text-gray-200">Streak</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500">Current</p>
                <p className="text-4xl font-black text-orange-400">{streak}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500">Longest</p>
                <p className="text-4xl font-black text-gray-100">{longestStreak}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500">Active Days</p>
                <p className="text-2xl font-bold text-emerald-300">{activeDays}</p>
              </div>
              <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500">Sessions</p>
                <p className="text-2xl font-bold text-indigo-300">{totalActivity || sessions}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold text-gray-200">Activity Calendar</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Less</span>
              {[0, 1, 2, 4].map(count => (
                <span key={count} className={`w-3 h-3 rounded-sm ${activityTone(count, false)}`} />
              ))}
              <span>More</span>
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="inline-flex gap-1 min-w-max">
              {activityGrid.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-rows-7 gap-1">
                  {week.map(day => (
                    <div
                      key={day.key}
                      title={`${day.key}: ${day.count} session${day.count === 1 ? '' : 's'}`}
                      className={`w-3.5 h-3.5 rounded-sm ${activityTone(day.count, day.outsideRange)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">Complete sessions on consecutive days to grow your streak.</p>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-gray-200">Subscription</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-white/[0.06] bg-gray-950 p-5">
              <p className="text-sm text-gray-500 mb-1">Current Plan</p>
              <p className="text-2xl font-bold text-gray-100 capitalize">{subscription?.plan || 'free'}</p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-gray-950 p-5">
              <p className="text-sm text-gray-500 mb-1">AI Usage This Month</p>
              <div className="space-y-3 mt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Hints</span>
                    <span className="text-gray-100 font-semibold">
                      {subscription?.usage?.hintsUsed || 0} / {(subscription?.plan === 'ultra' || subscription?.plan === 'premium') ? '180' : subscription?.plan === 'pro' ? '70' : '30'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((subscription?.usage?.hintsUsed || 0) / (subscription?.plan === 'ultra' ? 180 : subscription?.plan === 'premium' ? 180 : subscription?.plan === 'pro' ? 70 : 30)) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Analyzes</span>
                    <span className="text-gray-100 font-semibold">
                      {subscription?.usage?.analyzesUsed || 0} / {(subscription?.plan === 'ultra' || subscription?.plan === 'premium') ? '180' : subscription?.plan === 'pro' ? '70' : '30'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((subscription?.usage?.analyzesUsed || 0) / (subscription?.plan === 'ultra' ? 180 : subscription?.plan === 'premium' ? 180 : subscription?.plan === 'pro' ? 70 : 30)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-gray-950 p-5">
              <p className="text-sm text-gray-500 mb-1">Subscription</p>
              <div className="space-y-2 mt-2">
                <Link to="/subscription" className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold transition-all">
                  Manage Subscription
                </Link>
                {subscription?.plan !== 'free' && (
                  <Link to="/subscription" className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 font-semibold transition-all">
                    Cancel / Change Plan
                  </Link>
                )}
              </div>
            </div>

            {subscription?.plan === 'free' && (
              <div className="rounded-lg border border-white/[0.06] bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-100">Upgrade to Pro</p>
                    <p className="text-xs text-gray-500">₹99/month • 70 hints + analyzes</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">Unlock more AI hints, priority support & advanced analytics</p>
                <Link to="/subscription" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors">
                  Upgrade Now
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-gray-200">Achievements</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {ACHIEVEMENTS.map(achievement => {
              const earned = achievement.req(sessions, streak, elo)
              const Icon = earned ? achievement.icon : Lock
              return (
                <div
                  key={achievement.id}
                  className={`rounded-lg p-4 border transition-colors ${
                    earned
                      ? 'bg-indigo-500/10 border-indigo-500/30'
                      : 'bg-gray-950 border-gray-800 opacity-70'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-3 ${earned ? 'text-indigo-300' : 'text-gray-600'}`} />
                  <p className="text-sm font-semibold text-gray-200">{achievement.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{achievement.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        <GeminiKeyManager />
      </div>
    </div>
  )
}
