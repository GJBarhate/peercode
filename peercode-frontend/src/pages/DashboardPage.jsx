import { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Joyride } from 'react-joyride';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, AreaChart, Area } from 'recharts';
import { Trophy, Clock, Flame, TrendingUp, Plus, Calendar, Target, AlertCircle, Zap, Crown, Shield, TrendingDown, ArrowUpRight, Users, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useReveal } from '../hooks/useReveal';
import { useOnboardingTour, dashboardSteps } from '../hooks/useOnboardingTour';
import ContributionHeatmap from '../components/dashboard/ContributionHeatmap';
import GlowCard from '../components/common/GlowCard';
import TiltCard from '../components/common/TiltCard';
import { NoSessionsIllustration, NoDataIllustration } from '../components/common/EmptyStateIllustrations';
import { getProfile, getUserSessions, createRoom, getProblems, getSubscriptionStatus } from '../services/api';
import ForYouSection from '../components/dashboard/ForYouSection';

const PLAN_NAMES = { free: 'Free', pro: 'Pro', premium: 'Premium', ultra: 'Ultra Premium' }

function formatMonthLabel(monthKey) {
 const [year, month] = monthKey.split('-').map(Number)
 return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}


function useCountUp(target, duration = 800) {
 const [count, setCount] = useState(0);
 const frameRef = useRef(null);
 useEffect(() => {
 if (typeof target !== 'number' || isNaN(target)) { setCount(target); return; }
 const start = performance.now();
 const animate = (now) => {
 const elapsed = now - start;
 const progress = Math.min(elapsed / duration, 1);
 const eased = 1 - Math.pow(1 - progress, 3);
 setCount(Math.round(eased * target));
 if (progress < 1) frameRef.current = requestAnimationFrame(animate);
 };
 frameRef.current = requestAnimationFrame(animate);
 return () => cancelAnimationFrame(frameRef.current);
 }, [target, duration]);
 return count;
}

function StatCard({ icon: Icon, label, value, subtext, color = 'accent' }) {
 const colorClasses = {
 accent: 'text-accent border-accent/20 bg-accent/5',
 green: 'text-green-400 border-green-400/20 bg-green-400/5',
 blue: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
 orange: 'text-orange-400 border-orange-400/20 bg-orange-400/5'
 };
 const numericValue = typeof value === 'number' ? value : parseInt(value);
 const animated = useCountUp(isNaN(numericValue) ? 0 : numericValue);
 const displayValue = isNaN(numericValue) ? value : animated;
 const [ref, visible] = useReveal();

 return (
 <GlowCard>
 <div ref={ref} className={`rounded-xl border p-6 flex items-start gap-4 hover:scale-[1.02] transition-all duration-200 cursor-default glass-card ${colorClasses[color]} ${visible ? 'reveal-visible' : 'reveal-hidden'}`}>
 <div className="p-3 rounded-xl bg-bg-elevated backdrop-blur-sm">
 <Icon className="w-6 h-6" />
 </div>
 <div className="flex-1">
 <p className="text-sm text-text-muted mb-1">{label}</p>
 <div className="flex items-baseline gap-2">
 <span className="text-3xl font-bold text-text-primary tabular-nums">{displayValue}</span>
 {subtext && <span className="text-xs text-text-muted">{subtext}</span>}
 </div>
 </div>
 </div>
 </GlowCard>
 );
}

const HEATMAP_PALETTES = {
 light: { empty: '#ECEAFB', levels: ['#C4B5FD', '#A78BFA', '#7C3AED', '#5B21B6'] },
 dark: { empty: '#1f2937', levels: ['#86efac', '#4ade80', '#16a34a', '#15803d'] },
 dawn: { empty: '#F5EAD8', levels: ['#FDBA74', '#F97316', '#EA580C', '#C2410C'] },
 emerald: { empty: '#132A24', levels: ['#6EE7B7', '#34D399', '#059669', '#047857'] },
}

function ActivityCalendar({ sessions }) {
 const { theme } = useTheme()
 const palette = HEATMAP_PALETTES[theme] || HEATMAP_PALETTES.light
 const today = new Date()
 const activity = {}
 const allDays = []

 for (let i = 364; i >= 0; i--) {
 const date = new Date(today)
 date.setDate(date.getDate() - i)
 const key = date.toISOString().split('T')[0]
 activity[key] = 0
 allDays.push({ date: key, dateObj: new Date(date) })
 }

 sessions.forEach(s => {
 const date = new Date(s.createdAt).toISOString().split('T')[0]
 if (activity[date] !== undefined) activity[date]++
 })

 const weeks = []
 let currentWeek = []
 allDays.forEach(day => {
 currentWeek.push({ date: day.date, count: activity[day.date] || 0, dateObj: day.dateObj })
 if (currentWeek.length === 7) {
 weeks.push(currentWeek)
 currentWeek = []
 }
 })
 if (currentWeek.length > 0) weeks.push(currentWeek)

 const monthLabels = []
 let lastMonth = -1
 weeks.forEach((week, weekIndex) => {
 const month = week[0].dateObj.getMonth()
 if (month !== lastMonth) {
 monthLabels.push({ month, weekIndex })
 lastMonth = month
 }
 })

 const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
 const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

 const getColor = (count) => {
 if (count === 0) return palette.empty
 if (count === 1) return palette.levels[0]
 if (count === 2) return palette.levels[1]
 if (count <= 4) return palette.levels[2]
 return palette.levels[3]
 }

 return (
 <div className="bg-bg-surface rounded-lg p-6 border border-border-default">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-bold text-text-primary">Contribution Activity (52 Weeks)</h3>
 <div className="flex items-center gap-2 text-xs text-text-muted">
 <span>{sessions.length} sessions</span>
 <span>&middot;</span>
 <span>Max: {Math.max(...Object.values(activity), 0)} day</span>
 </div>
 </div>

 <div className="overflow-x-auto pb-4">
 <div className="mb-2 flex pl-8">
 {monthLabels.map((label, i) => (
 <div
 key={i}
 className="text-xs text-text-muted font-medium"
 style={{ width: `${(label.weekIndex + 1 - (monthLabels[i - 1]?.weekIndex || 0)) * 16}px` }}
 >
 {monthNames[label.month]}
 </div>
 ))}
 </div>

 <div className="flex gap-1 min-w-max">
 <div className="flex flex-col gap-1 mt-6">
 {dayNames.map((day, i) => (
 <div key={i} className="w-6 h-3 text-xs text-text-muted flex items-center justify-center font-medium">
 {day}
 </div>
 ))}
 </div>

 <div className="flex gap-1">
 {weeks.map((week, i) => (
 <div key={i} className="flex flex-col gap-1">
 {week.map((day, j) => (
 <div
 key={j}
 className="w-3 h-3 rounded-sm transition hover:ring-1 hover:ring-brand hover:scale-125 cursor-pointer"
 style={{ backgroundColor: getColor(day.count) }}
 title={`${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
 />
 ))}
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-2 mt-4 text-xs text-text-muted">
 <span>Less</span>
 <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: palette.empty }} />
 {palette.levels.map((c, i) => (
 <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
 ))}
 <span>More</span>
 </div>

 {sessions.length === 0 && (
 <div className="text-center py-8">
 <NoSessionsIllustration />
 <p className="text-text-muted text-sm">No sessions yet. Start practicing to build your contribution graph!</p>
 </div>
 )}
 </div>
 )
}

function MonthlyStats({ sessions }) {
 const monthlyData = Array(12).fill(0)
 const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

 sessions.forEach(s => {
 const month = new Date(s.createdAt).getMonth()
 monthlyData[month]++
 })

 const data = months.map((name, i) => ({ name, sessions: monthlyData[i] }))
 const avg = Math.round(data.reduce((sum, d) => sum + d.sessions, 0) / 12)
 const maxMonth = Math.max(...monthlyData, 0)
 const yMax = maxMonth + 2

 return (
 <div className="bg-bg-surface rounded-lg p-6 border border-border-default">
 <h3 className="text-lg font-bold text-text-primary mb-4">Sessions by Month</h3>
 <ResponsiveContainer width="100%" height={300}>
 <BarChart data={data}>
 <XAxis dataKey="name" stroke="var(--color-chart-axis)" style={{ fontSize: '12px' }} />
 <YAxis stroke="var(--color-chart-axis)" style={{ fontSize: '12px' }} domain={[0, yMax]} />
 <Tooltip
 contentStyle={{ backgroundColor: 'var(--color-chart-tooltip-bg)', border: '1px solid var(--color-chart-tooltip-border)', borderRadius: '8px' }}
 labelStyle={{ color: 'var(--color-chart-tooltip-text)' }}
 />
 <Bar dataKey="sessions" fill="var(--color-brand)" radius={[8, 8, 0, 0]} />
 <ReferenceLine y={avg} stroke="var(--color-error)" strokeDasharray="3 3" label={{ value: 'Avg', fill: 'var(--color-error)', fontSize: 12 }} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 )
}

export default function DashboardPage() {
 const { user } = useAuth();
 const navigate = useNavigate();
 const { run: tourRun, completeTour } = useOnboardingTour('dashboard');
 const [profile, setProfile] = useState(null);
 const [sessions, setSessions] = useState([]);
 const [problems, setProblems] = useState([]);
 const [subscription, setSubscription] = useState(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
 const loadDashboard = async () => {
 try {
 setIsLoading(true);
 setError(null);
 const [profileRes, sessionsRes, problemsRes, subRes] = await Promise.allSettled([
 getProfile(),
 getUserSessions({ limit: 500 }),
 getProblems(),
 getSubscriptionStatus()
 ]);
 if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
 if (sessionsRes.status === 'fulfilled') {
 const sessionsData = sessionsRes.value.data;
 setSessions(Array.isArray(sessionsData) ? sessionsData : (sessionsData?.sessions || []));
 }
 if (problemsRes.status === 'fulfilled') setProblems(problemsRes.value.data?.problems || []);
 if (subRes.status === 'fulfilled') {
 setSubscription(subRes.value.data?.data || { plan: 'free', status: 'active', usage: { hints: { used: 0, limit: null }, analyzes: { used: 0, limit: null } } });
 }
 } catch (err) {
 setError('Failed to load dashboard');
 } finally {
 setIsLoading(false);
 }
 };

 loadDashboard();
 }, []);

const sortedSessions = useMemo(() =>
 [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
 [sessions]
 );

 const currentStreak = profile?.currentStreak || 0;
 const nextMilestone = currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : 100;
 const streakProgress = (currentStreak / nextMilestone) * 100;
 const monthlyStreakBadges = profile?.monthlyStreakBadges || [];

 const longestStreak = (() => {
 if (!sessions.length) return profile?.longestStreak || 0;
 const dates = [...new Set(sessions.map(s => new Date(s.createdAt).toISOString().split('T')[0]))].sort();
 if (dates.length <= 1) return dates.length;
 let longest = 1, current = 1;
 for (let i = 1; i < dates.length; i++) {
 const diff = (new Date(dates[i]) - new Date(dates[i-1])) / (1000 * 60 * 60 * 24);
 if (Math.round(diff) === 1) current++;
 else { longest = Math.max(longest, current); current = 1; }
 }
 return Math.max(longest, current);
 })();

 const elo = profile?.elo || 1200;
 const percentile = Math.min(100, Math.max(0, Math.round((elo - 800) / 1200 * 100)));
 const hasSessionToday = sessions.some(s => new Date(s.createdAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]);

 const randomProblem = useMemo(() => {
 const solvedSlugs = new Set(Array.isArray(sessions) ? sessions.filter(s => s.testResults?.allPassed).map(s => s.problemSnapshot?.slug || s.problem?.slug).filter(Boolean) : [])
 const unsolved = problems.filter(p => !solvedSlugs.has(p.slug))
 const pool = unsolved.length > 0 ? unsolved : problems
 return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
 }, [problems, sessions]);

 if (isLoading) {
 return (
 <div className="min-h-screen bg-bg-base">
 <main className="max-w-7xl mx-auto px-6 pt-6 pb-12">
 <div className="h-10 w-64 bg-bg-overlay dark:bg-bg-surface/5 rounded animate-pulse mb-8" />
 <div className="grid grid-cols-4 gap-6">
 {[1,2,3,4].map(i => <div key={i} className="h-32 bg-bg-overlay dark:bg-bg-surface/5 rounded animate-pulse" />)}
 </div>
 </main>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-bg-base">
 <Helmet>
 <title>Dashboard — PeerCode</title>
 <meta name="description" content="Track your coding progress, ELO rating, streaks, and session history." />
 </Helmet>
 <Joyride
 steps={dashboardSteps}
 run={tourRun}
 continuous
 showSkipButton
 showProgress
 callback={(data) => { if (data.status === 'finished' || data.status === 'skipped') completeTour() }}
 styles={{
 options: {
 primaryColor: 'var(--color-brand)',
 backgroundColor: 'var(--color-bg-surface)',
 textColor: 'var(--color-text-primary)',
 arrowColor: 'var(--color-bg-surface)',
 },
 tooltip: { borderRadius: '12px', border: '1px solid var(--color-border-default)' },
 buttonNext: { borderRadius: '8px' },
 buttonBack: { color: 'var(--color-text-secondary)' },
 buttonSkip: { color: 'var(--color-text-muted)' },
 }}
 />
 <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6">
 {/* Header */}
 <div>
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-3xl font-bold text-shimmer">Dashboard</h1>
 <p className="text-text-secondary">Welcome back, {user?.username}</p>
 </div>
 </div>

 {/* Practice CTAs */}
 <div data-tour="practice-ctas" className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Link
 to="/problems"
 className="group relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-indigo-800/10 p-6 hover:from-indigo-600/30 hover:to-indigo-800/20 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 glass-card"
 >
 <div className="flex items-start gap-4">
 <div className="p-3 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600/30 transition-colors">
 <Zap className="w-6 h-6 text-indigo-400" />
 </div>
 <div className="flex-1">
 <h3 className="text-lg font-bold text-text-primary mb-1">Solve Problems Solo</h3>
 <p className="text-sm text-text-muted">Browse 20+ problems, practice at your own pace with AI hints & test runner</p>
 </div>
 <ArrowUpRight className="w-5 h-5 text-indigo-400 mt-2 flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
 </div>
 </Link>

 <Link
 to="/find-partner"
 className="group relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/20 to-violet-800/10 p-6 hover:from-violet-600/30 hover:to-violet-800/20 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 glass-card"
 >
 <div className="flex items-start gap-4">
 <div className="p-3 rounded-xl bg-violet-600/20 group-hover:bg-violet-600/30 transition-colors">
 <Users className="w-6 h-6 text-violet-400" />
 </div>
 <div className="flex-1">
 <h3 className="text-lg font-bold text-text-primary mb-1">Practice with a Partner</h3>
 <p className="text-sm text-text-muted">Real-time collaborative coding with WebRTC video, shared editor & live chat</p>
 </div>
 <ArrowUpRight className="w-5 h-5 text-violet-400 mt-2 flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
 </div>
 </Link>

 <Link
 to="/ai-interview"
 className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 to-teal-800/10 p-6 hover:from-emerald-600/30 hover:to-teal-800/20 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 glass-card"
 >
 <div className="flex items-start gap-4">
 <div className="p-3 rounded-xl bg-emerald-600/20 group-hover:bg-emerald-600/30 transition-colors">
 <Bot className="w-6 h-6 text-emerald-400" />
 </div>
 <div className="flex-1">
 <h3 className="text-lg font-bold text-text-primary mb-1">AI Mock Interview</h3>
 <p className="text-sm text-text-muted">Upload resume, practice for MNCs with AI interviewer & get detailed feedback</p>
 </div>
 <ArrowUpRight className="w-5 h-5 text-emerald-400 mt-2 flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
 </div>
 </Link>
 </div>
 </div>

 {/* Stat Cards */}
 <div data-tour="stat-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-reveal">
 <StatCard icon={Trophy} label="Current ELO" value={profile?.elo || 1200} color="accent" />
 <StatCard icon={Target} label="Sessions Completed" value={sessions.length} color="blue" />
 <StatCard icon={Flame} label="Current Streak" value={profile?.currentStreak || 0} subtext="days" color="orange" />
 <StatCard icon={Clock} label="Avg Duration" value={sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / sessions.length / 60) : 0} subtext="min" color="green" />
 </div>

 {/* Subscription Status */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 <div className="rounded-lg border border-border-default bg-bg-surface p-6">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-text-muted mb-1">Current Plan</p>
 <p className="text-2xl font-bold text-text-primary">{PLAN_NAMES[subscription?.plan] || 'Free'}</p>
 </div>
 <div className={`p-3 rounded-lg ${subscription?.plan === 'free' ? 'bg-bg-overlay' : subscription?.plan === 'pro' ? 'bg-amber-500/20' : subscription?.plan === 'premium' ? 'bg-purple-500/20' : 'bg-pink-500/20'}`}>
 <Crown className={`w-5 h-5 ${subscription?.plan === 'free' ? 'text-text-muted' : subscription?.plan === 'pro' ? 'text-amber-400' : subscription?.plan === 'premium' ? 'text-purple-400' : 'text-pink-400'}`} />
 </div>
 </div>
 <div className="mt-4 flex items-center justify-between">
 <span className="text-sm text-text-muted">Status</span>
 <span className={`text-sm font-medium px-2 py-1 rounded ${subscription?.status === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
 {subscription?.status || 'active'}
 </span>
 </div>
 </div>

 <div className="rounded-lg border border-border-default bg-bg-surface p-6">
 <p className="text-sm text-text-muted mb-1">AI Usage This Month</p>
 <div className="space-y-3 mt-2">
 <div>
 <div className="flex justify-between text-xs mb-1">
 <span className="text-text-secondary">Hints</span>
 <span className="text-text-primary font-semibold">
 {subscription?.usage?.hints?.used ?? 0} / {subscription?.usage?.hints?.limit != null ? subscription.usage.hints.limit : '∞'}
 </span>
 </div>
 <div className="w-full bg-bg-overlay dark:bg-bg-surface/10 rounded-full h-1.5">
 <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${subscription?.usage?.hints?.limit != null ? Math.min(100, ((subscription?.usage?.hints?.used ?? 0) / subscription.usage.hints.limit) * 100) : 5}%` }} />
 </div>
 </div>
 <div>
 <div className="flex justify-between text-xs mb-1">
 <span className="text-text-secondary">Analyzes</span>
 <span className="text-text-primary font-semibold">
 {subscription?.usage?.analyzes?.used ?? 0} / {subscription?.usage?.analyzes?.limit != null ? subscription.usage.analyzes.limit : '∞'}
 </span>
 </div>
 <div className="w-full bg-bg-overlay dark:bg-bg-surface/10 rounded-full h-1.5">
 <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full" style={{ width: `${subscription?.usage?.analyzes?.limit != null ? Math.min(100, ((subscription?.usage?.analyzes?.used ?? 0) / subscription.usage.analyzes.limit) * 100) : 5}%` }} />
 </div>
 </div>
 </div>
 </div>

 <div className="rounded-lg border border-border-default bg-bg-surface p-6">
 <p className="text-sm text-text-muted mb-1">Subscription</p>
 <div className="space-y-2 mt-2">
 <Link to="/subscription" className="flex items-center justify-between w-full p-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium transition-all">
 <span>Manage Subscription</span>
 <ArrowUpRight className="w-4 h-4" />
 </Link>
 {subscription?.plan !== 'free' && (
 <Link to="/subscription" className="flex items-center justify-between w-full p-3 rounded-lg border border-border-strong hover:bg-bg-elevated text-text-primary font-medium transition-all">
 <span>Cancel / Change Plan</span>
 </Link>
 )}
 </div>
 </div>

 {subscription?.plan === 'free' && (
 <div className="rounded-lg border border-border-default bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-6">
 <div className="flex items-center gap-3 mb-3">
 <div className="p-2 bg-amber-500/20 rounded-lg">
 <Crown className="w-5 h-5 text-amber-400" />
 </div>
 <div>
 <p className="font-semibold text-text-primary">Upgrade to Pro</p>
 <p className="text-xs text-text-muted">₹99/month • 70 hints + analyzes</p>
 </div>
 </div>
 <p className="text-sm text-text-secondary mb-4">Unlock more AI hints, priority support & advanced analytics</p>
 <Link to="/subscription" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors">
 Upgrade Now
 <ArrowUpRight className="w-4 h-4" />
 </Link>
 </div>
 )}
 </div>

 {/* Row 2: ELO Trend + Streak Card */}
 <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
 {/* ELO Trend */}
 <div data-tour="elo-trend" className="rounded-lg border border-border-default bg-bg-surface p-6">
 <h3 className="text-lg font-bold text-text-primary mb-4">ELO Trend</h3>
 {sortedSessions.length > 0 ? (() => {
 const eloData = sortedSessions.slice(-20).map((s, i) => {
 const myElo = s.eloData?.find(e => e.userId === user?.id || e.userId === user?._id || String(e.userId) === String(user?.id))
 const elo = myElo?.eloAtEnd || s.eloAtEnd || s.eloData?.[0]?.eloAtEnd || 1200
 return { i: i + 1, elo }
 })
 const computed = eloData.map((d, i) => ({
 ...d,
 delta: i > 0 ? d.elo - eloData[i - 1].elo : 0
 }))
 return (
 <ResponsiveContainer width="100%" height={300}>
 <AreaChart data={computed}>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" vertical={false} />
 <XAxis dataKey="i" stroke="var(--color-chart-axis)" tick={{ fontSize: 12 }} label={false} />
 <YAxis
 stroke="var(--color-chart-axis)"
 tick={{ fontSize: 12 }}
 domain={['auto', 'auto']}
 tickFormatter={(v) => Math.round(v)}
 />
 <Tooltip
 contentStyle={{
 backgroundColor: 'var(--color-chart-tooltip-bg)',
 border: '1px solid var(--color-chart-tooltip-border)',
 borderRadius: '8px',
 boxShadow: 'var(--shadow-lg)',
 }}
 labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
 formatter={(value, name, props) => {
 const delta = props.payload?.delta
 return [
 <span style={{ color: 'var(--color-text-primary)' }}>
 {value} {delta != null && (delta >= 0 ? <span className="text-green-500">(+{delta})</span> : <span className="text-red-500">({delta})</span>)}
 </span>,
 'ELO'
 ]
 }}
 labelFormatter={(label) => `Session #${label}`}
 />
 <defs>
 <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.3} />
 <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
 </linearGradient>
 </defs>
 <Area
 type="monotone"
 dataKey="elo"
 stroke="var(--color-brand)"
 strokeWidth={2}
 fill="url(#eloGradient)"
 dot={false}
 activeDot={{ r: 5, fill: 'var(--color-brand)', stroke: 'var(--color-bg-surface)', strokeWidth: 2 }}
 />
 </AreaChart>
 </ResponsiveContainer>
 )
 })() : (
 <div className="h-60 flex flex-col items-center justify-center text-text-muted">
 <NoDataIllustration />
 <span>No data yet</span>
 </div>
 )}
 </div>

 {/* Streak Card */}
 <div className="rounded-lg border border-orange-400/20 bg-bg-surface p-6">
 <div className="flex items-center gap-2 mb-4">
 <span className="text-2xl">🔥</span>
 <h3 className="text-lg font-bold text-text-primary">Current Streak</h3>
 </div>
 <div className="text-5xl font-bold text-orange-400 mb-4">{currentStreak}</div>
 <div className="mb-2">
 <div className="w-full bg-bg-overlay rounded-full h-2">
 <div className="bg-orange-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, streakProgress)}%` }} />
 </div>
 </div>
 <p className="text-sm text-text-muted mb-4">{currentStreak}/{nextMilestone} days to next milestone</p>
 <p className="text-sm text-text-muted mb-4">Longest streak: <span className="text-text-primary font-semibold">{longestStreak}</span> days</p>
 {!hasSessionToday && (
 <p className="text-sm text-orange-400 font-medium">Keep it up! Practice today to maintain your streak.</p>
 )}
 {monthlyStreakBadges.length > 0 && (
 <div className="mt-5 pt-4 border-t border-border-default">
 <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">Perfect Months</p>
 <div className="flex flex-wrap gap-2">
 {monthlyStreakBadges.map(({ month }) => (
 <div
 key={month}
 title={`Solved a problem every day of ${formatMonthLabel(month)}`}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-500"
 >
 <span className="text-sm">🏅</span>
 <span className="text-xs font-semibold">{formatMonthLabel(month)}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Row 3: Monthly Sessions */}
 {sortedSessions.length > 0 && <MonthlyStats sessions={sortedSessions} />}

 {/* Row 4: Rank, Quick Links, Next Problem */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Your Rank */}
 <div className="rounded-lg border border-border-default bg-bg-surface p-6">
 <h3 className="text-lg font-bold text-text-primary mb-4">Your Rank</h3>
 <div className="text-3xl font-bold text-accent mb-2">Top {percentile}%</div>
 <div className="w-full bg-bg-overlay rounded-full h-2 mb-2">
 <div className="bg-accent h-2 rounded-full" style={{ width: `${percentile}%` }} />
 </div>
 <p className="text-sm text-text-muted">ELO: {elo}</p>
 </div>

 {/* Quick Links */}
 <div data-tour="quick-links" className="rounded-lg border border-border-default bg-bg-surface p-6">
 <h3 className="text-lg font-bold text-text-primary mb-4">Quick Links</h3>
 <div className="flex flex-col gap-2.5">
 <Link to="/tracks" className="group flex items-center justify-between text-sm text-text-primary hover:text-accent transition-colors">
 <span className="flex items-center gap-2"><span>📚</span> Browse Tracks</span>
 <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
 </Link>
 <Link to="/ai-interview" className="group flex items-center justify-between text-sm text-text-primary hover:text-accent transition-colors">
 <span className="flex items-center gap-2"><span>🤖</span> Mock Interview</span>
 <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
 </Link>
 <Link to="/contests" className="group flex items-center justify-between text-sm text-text-primary hover:text-accent transition-colors">
 <span className="flex items-center gap-2"><span>🏆</span> Contests</span>
 <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
 </Link>
 <Link to="/leaderboard" className="group flex items-center justify-between text-sm text-text-primary hover:text-accent transition-colors">
 <span className="flex items-center gap-2"><span>📊</span> Leaderboard</span>
 <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
 </Link>
 <Link to="/profile" className="group flex items-center justify-between text-sm text-text-primary hover:text-accent transition-colors">
 <span className="flex items-center gap-2"><span>👤</span> My Profile</span>
 <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
 </Link>
 <Link to="/subscription" className="group flex items-center justify-between text-sm text-text-primary hover:text-accent transition-colors">
 <span className="flex items-center gap-2"><span>👑</span> Subscription</span>
 <span className="text-accent group-hover:translate-x-1 transition-transform">→</span>
 </Link>
 </div>
 </div>

 {/* Next Problem */}
 <div className="rounded-lg border border-border-default bg-bg-surface p-6 flex flex-col">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-bold text-text-primary">Suggested Next</h3>
 {randomProblem && <span className="text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Unsolved</span>}
 </div>
 {randomProblem ? (
 <Link to={`/problems/${randomProblem.slug || randomProblem._id}`} className="group flex flex-col flex-1 gap-3 -m-2 p-2 rounded-lg hover:bg-bg-hover transition-colors">
 <div className="flex items-start justify-between gap-2">
 <span className="font-semibold text-text-primary text-base leading-tight">{randomProblem.title}</span>
 <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
 randomProblem.difficulty?.toLowerCase() === 'easy' ? 'bg-emerald-500/10 text-emerald-400'
 : randomProblem.difficulty?.toLowerCase() === 'hard' ? 'bg-red-500/10 text-red-400'
 : 'bg-amber-500/10 text-amber-400'
 }`}>{randomProblem.difficulty}</span>
 </div>
 {randomProblem.tags?.length > 0 && (
 <div className="flex flex-wrap gap-1">
 {randomProblem.tags.slice(0, 3).map(t => (
 <span key={t} className="text-[10px] bg-bg-elevated text-text-muted px-1.5 py-0.5 rounded">{t}</span>
 ))}
 </div>
 )}
 <span className="mt-auto text-sm text-accent font-medium group-hover:translate-x-1 transition-transform">Start solving →</span>
 </Link>
 ) : (
 <p className="text-sm text-text-muted">No problems available yet.</p>
 )}
 </div>
 </div>

 {/* Heatmap */}
 {sortedSessions.length > 0 && <ContributionHeatmap sessions={sortedSessions} />}

 {/* Today's Goal */}
 {!hasSessionToday && (
 <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/5 p-5">
 <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
 <div className="flex items-center gap-4">
 <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">🎯</div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-amber-300 text-sm mb-0.5">Complete today's practice session!</p>
 <p className="text-xs text-amber-400/70">
 {currentStreak > 0 ? `You're on a ${currentStreak}-day streak — don't break it!` : 'Start a streak today — one session a day keeps the offer away.'}
 </p>
 </div>
 <Link to="/problems" className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-amber-900 bg-amber-400 hover:bg-amber-300 transition-colors active:scale-[0.97]">
 <Zap className="w-3.5 h-3.5" />
 Practice Now
 </Link>
 </div>
 </div>
 )}

 {/* For You — Smart Recommendations */}
 <ForYouSection />

 {/* Recent Sessions */}
 <div className="rounded-lg border border-border-default bg-bg-surface p-6">
 <h3 className="text-lg font-bold text-text-primary mb-4">Recent Sessions</h3>
 {sortedSessions.length === 0 ? (
 <div className="text-center py-12">
 <NoSessionsIllustration />
 <p className="text-text-muted mb-4">No sessions yet. Start practicing to see your progress!</p>
 <Link to="/match" className="btn-primary">Start Practicing</Link>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border-default">
 <th className="text-left py-3 px-4 font-semibold text-text-muted">Problem</th>
 <th className="text-left py-3 px-4 font-semibold text-text-muted">Status</th>
 <th className="text-left py-3 px-4 font-semibold text-text-muted">Duration</th>
 <th className="text-right py-3 px-4 font-semibold text-text-muted">ELO CHANGE</th>
 <th className="text-right py-3 px-4 font-semibold text-text-muted">ACTION</th>
 </tr>
 </thead>
 </table>
 <div style={{ height: Math.min(sortedSessions.length * 48, 480), overflow: 'auto' }}>
 {sortedSessions.map(s => (
 <div key={s._id} className="flex items-center text-sm border-b border-border-default hover:bg-bg-base dark:hover:bg-white/[0.02]" style={{ height: 48 }}>
 <div className="flex-[2] py-3 px-4 text-text-primary truncate">{s.problemSnapshot?.title || 'Unknown'}</div>
 <div className="flex-[1.5] py-3 px-4">
 <span className={s.testResults?.allPassed ? 'text-green-400' : 'text-red-400'}>
 {s.testResults?.allPassed ? '✓ Accepted' : '✗ Wrong'}
 </span>
 </div>
 <div className="flex-1 py-3 px-4 text-text-muted">{Math.round((s.duration || 0) / 60)}m</div>
 <div className="flex-1 py-3 px-4 text-right">
 {s.eloDelta != null ? (
 <span className={s.eloDelta >= 0 ? 'text-green-400' : 'text-red-400'}>
 {s.eloDelta >= 0 ? '+' : ''}{s.eloDelta}
 </span>
 ) : (
 <span className="text-text-muted">—</span>
 )}
 </div>
 <div className="flex-1 py-3 px-4 text-right">
 <Link to={`/debrief/${s.roomId || s._id}`} className="text-accent hover:text-accent-hover transition-colors text-sm">
 Debrief →
 </Link>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </main>
 </div>
 );
}
