import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, AreaChart, Area } from 'recharts';
import { Trophy, Clock, Flame, TrendingUp, Plus, Calendar, Target, AlertCircle, Zap, Crown, Shield, TrendingDown, ArrowUpRight } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import ContributionHeatmap from '../components/dashboard/ContributionHeatmap';
import { getProfile, getUserSessions, createRoom, getProblems, getSubscriptionStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';


// Stat card component
function StatCard({ icon: Icon, label, value, subtext, color = 'accent' }) {
  const colorClasses = {
    accent: 'text-accent border-accent/20 bg-accent/5',
    green: 'text-green-400 border-green-400/20 bg-green-400/5',
    blue: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
    orange: 'text-orange-400 border-orange-400/20 bg-orange-400/5'
  };

  return (
    <div className={`rounded-lg border p-6 flex items-start gap-4 ${colorClasses[color]}`}>
      <div className="p-3 rounded-lg bg-white/5 backdrop-blur-sm">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-text-tertiary mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary">{value}</span>
          {subtext && <span className="text-xs text-text-tertiary">{subtext}</span>}
        </div>
      </div>
    </div>
  );
}

function ActivityCalendar({ sessions }) {
  // Generate last 365 days of activity (52 weeks)
  const today = new Date()
  const activity = {}
  const allDays = []
  
  // Initialize all days with 0 and collect them
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0]
    activity[key] = 0
    allDays.push({ date: key, dateObj: new Date(date) })
  }
  
  // Count sessions per day
  sessions.forEach(s => {
    const date = new Date(s.createdAt).toISOString().split('T')[0]
    if (activity[date] !== undefined) activity[date]++
  })
  
  // Group into weeks (Sun-Sat)
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
  
  // Get month labels for top
  const monthLabels = []
  let lastMonth = -1
  weeks.forEach((week, weekIndex) => {
    const firstDayOfWeek = week[0].dateObj
    const month = firstDayOfWeek.getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ month, weekIndex })
      lastMonth = month
    }
  })
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const getColor = (count) => {
    if (count === 0) return '#1f2937'
    if (count === 1) return '#86efac'
    if (count === 2) return '#4ade80'
    if (count <= 4) return '#16a34a'
    return '#15803d'
  }
  
  const getTotalSessions = () => sessions.length
  const getMaxDayCount = () => Math.max(...Object.values(activity), 0)
  
  return (
    <div className="bg-surface rounded-lg p-6 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-primary">Contribution Activity (52 Weeks)</h3>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span>{getTotalSessions()} sessions</span>
          <span>•</span>
          <span>Max: {getMaxDayCount()} day</span>
        </div>
      </div>
      
      {/* Heatmap */}
      <div className="overflow-x-auto pb-4">
        <div className="mb-2 flex pl-8">
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="text-xs text-text-tertiary font-medium"
              style={{ width: `${(label.weekIndex + 1 - (monthLabels[i - 1]?.weekIndex || 0)) * 16}px` }}
            >
              {monthNames[label.month]}
            </div>
          ))}
        </div>
        
        <div className="flex gap-1 min-w-max">
          {/* Day names column */}
          <div className="flex flex-col gap-1 mt-6">
            {dayNames.map((day, i) => (
              <div
                key={i}
                className="w-6 h-3 text-xs text-text-tertiary flex items-center justify-center font-medium"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Heat map grid */}
          <div className="flex gap-1">
            {weeks.map((week, i) => (
              <div key={i} className="flex flex-col gap-1">
                {week.map((day, j) => (
                  <div
                    key={j}
                    className="w-3 h-3 rounded-sm transition hover:ring-1 hover:ring-accent hover:scale-125 cursor-pointer"
                    style={{ backgroundColor: getColor(day.count) }}
                    title={`${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-text-tertiary">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#1f2937' }} />
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#86efac' }} />
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#4ade80' }} />
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#16a34a' }} />
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#15803d' }} />
        <span>More</span>
      </div>
      
      {sessions.length === 0 && (
        <div className="text-center text-text-tertiary text-sm py-8">
          No sessions yet. Start practicing to build your contribution graph!
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
    <div className="bg-surface rounded-lg p-6 border border-white/[0.06]">
      <h3 className="text-lg font-bold text-text-primary mb-4">Sessions by Month</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, yMax]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0a0a14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}
            labelStyle={{ color: '#f1f1f5' }}
          />
          <Bar dataKey="sessions" fill="#6d4df2" radius={[8, 8, 0, 0]} />
          <ReferenceLine y={avg} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Avg', fill: '#ef4444', fontSize: 12 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        const [profileRes, sessionsRes, problemsRes, subRes] = await Promise.all([
          getProfile(),
          getUserSessions(),
          getProblems(),
          getSubscriptionStatus()
        ]);
        setProfile(profileRes.data);
        setSessions(sessionsRes.data || []);
        setProblems(problemsRes.data || []);
        setSubscription(subRes.data || { plan: 'free', status: 'active', usage: { hintsUsed: 0, analyzesUsed: 0 } });
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

const sortedSessions = [...sessions].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const currentStreak = profile?.currentStreak || 0;
  const nextMilestone = currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : 100;
  const streakProgress = (currentStreak / nextMilestone) * 100;

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

  const randomProblem = problems.length > 0 ? problems[0] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="h-10 w-64 bg-white/5 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded animate-pulse" />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-secondary">Welcome back, {user?.username}</p>
          </div>
          <Link
            to="/problems"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#6d4df2] hover:bg-[#7c5ff5] text-white transition-all duration-150 active:scale-[0.98]"
          >
            <Zap className="w-4 h-4" />
            Quick Start ⚡
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Trophy} label="Current ELO" value={profile?.elo || 1200} color="accent" />
          <StatCard icon={Target} label="Sessions Completed" value={sessions.length} color="blue" />
          <StatCard icon={Flame} label="Current Streak" value={profile?.currentStreak || 0} subtext="days" color="orange" />
          <StatCard icon={Clock} label="Avg Duration" value={sessions.length > 0 ? Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / sessions.length / 60) : 0} subtext="min" color="green" />
        </div>

        {/* Subscription Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-lg border border-white/[0.06] bg-surface p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-tertiary mb-1">Current Plan</p>
                <p className="text-2xl font-bold text-text-primary capitalize">{subscription?.plan || 'free'}</p>
              </div>
              <div className={`p-3 rounded-lg ${subscription?.plan === 'free' ? 'bg-gray-600/20' : subscription?.plan === 'pro' ? 'bg-amber-500/20' : subscription?.plan === 'premium' ? 'bg-purple-500/20' : 'bg-pink-500/20'}`}>
                <Crown className={`w-5 h-5 ${subscription?.plan === 'free' ? 'text-gray-400' : subscription?.plan === 'pro' ? 'text-amber-400' : subscription?.plan === 'premium' ? 'text-purple-400' : 'text-pink-400'}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-text-tertiary">Status</span>
              <span className={`text-sm font-medium px-2 py-1 rounded ${subscription?.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {subscription?.status || 'active'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-surface p-6">
            <p className="text-sm text-text-tertiary mb-1">AI Usage This Month</p>
            <div className="space-y-3 mt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary">Hints</span>
                  <span className="text-text-primary font-semibold">
                    {subscription?.usage?.hintsUsed || 0} / {(subscription?.plan === 'ultra' || subscription?.plan === 'premium') ? '180' : subscription?.plan === 'pro' ? '70' : '30'}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((subscription?.usage?.hintsUsed || 0) / (subscription?.plan === 'ultra' ? 180 : subscription?.plan === 'premium' ? 180 : subscription?.plan === 'pro' ? 70 : 30)) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary">Analyzes</span>
                  <span className="text-text-primary font-semibold">
                    {subscription?.usage?.analyzesUsed || 0} / {(subscription?.plan === 'ultra' || subscription?.plan === 'premium') ? '180' : subscription?.plan === 'pro' ? '70' : '30'}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((subscription?.usage?.analyzesUsed || 0) / (subscription?.plan === 'ultra' ? 180 : subscription?.plan === 'premium' ? 180 : subscription?.plan === 'pro' ? 70 : 30)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-surface p-6">
            <p className="text-sm text-text-tertiary mb-1">Subscription</p>
            <div className="space-y-2 mt-2">
              <Link to="/subscription" className="flex items-center justify-between w-full p-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium transition-all">
                <span>Manage Subscription</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              {subscription?.plan !== 'free' && (
                <Link to="/subscription" className="flex items-center justify-between w-full p-3 rounded-lg border border-gray-700 hover:bg-white/5 text-text-primary font-medium transition-all">
                  <span>Cancel / Change Plan</span>
                </Link>
              )}
            </div>
          </div>

          {subscription?.plan === 'free' && (
            <div className="rounded-lg border border-white/[0.06] bg-gradient-to-br from-amber-500/10 to-orange-600/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Upgrade to Pro</p>
                  <p className="text-xs text-text-tertiary">₹99/month • 70 hints + analyzes</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6 mb-8">
          {/* ELO Trend */}
          <div className="rounded-lg border border-white/[0.06] bg-surface p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">ELO Trend</h3>
            {sortedSessions.length > 0 ? (() => {
              const eloData = sortedSessions.slice(-20).map((s, i) => {
                const myElo = s.eloData?.find(e => e.userId === user?.id)
                const elo = myElo?.eloAtEnd || s.eloAtEnd || 1200
                return { i: i + 1, elo }
              })
              const computed = eloData.map((d, i) => ({
                ...d,
                delta: i > 0 ? d.elo - eloData[i - 1].elo : 0
              }))
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={computed}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="i" stroke="#5a5a72" tick={{ fontSize: 12 }} label={false} />
                    <YAxis
                      stroke="#5a5a72"
                      tick={{ fontSize: 12 }}
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => Math.round(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#181830',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      }}
                      labelStyle={{ color: '#f1f1f5', fontWeight: 600 }}
                      formatter={(value, name, props) => {
                        const delta = props.payload?.delta
                        return [
                          <span className="text-[#f1f1f5]">
                            {value} {delta != null && (delta >= 0 ? <span className="text-green-400">(+{delta})</span> : <span className="text-red-400">({delta})</span>)}
                          </span>,
                          'ELO'
                        ]
                      }}
                      labelFormatter={(label) => `Session #${label}`}
                    />
                    <defs>
                      <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6d4df2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6d4df2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="elo"
                      stroke="#6d4df2"
                      strokeWidth={2}
                      fill="url(#eloGradient)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#6d4df2', stroke: '#181830', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )
            })() : (
              <div className="h-60 flex items-center justify-center text-text-tertiary">No data yet</div>
            )}
          </div>

          {/* Streak Card */}
          <div className="rounded-lg border border-orange-400/20 bg-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔥</span>
              <h3 className="text-lg font-bold text-text-primary">Current Streak</h3>
            </div>
            <div className="text-5xl font-bold text-orange-400 mb-4">{currentStreak}</div>
            <div className="mb-2">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-orange-400 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, streakProgress)}%` }} />
              </div>
            </div>
            <p className="text-sm text-text-tertiary mb-4">{currentStreak}/{nextMilestone} days to next milestone</p>
            <p className="text-sm text-text-tertiary mb-4">Longest streak: <span className="text-text-primary font-semibold">{longestStreak}</span> days</p>
            {!hasSessionToday && (
              <p className="text-sm text-orange-400 font-medium">Keep it up! Practice today to maintain your streak.</p>
            )}
          </div>
        </div>

        {/* Row 3: Monthly Sessions */}
        {sortedSessions.length > 0 && <div className="mb-8"><MonthlyStats sessions={sortedSessions} /></div>}

        {/* Row 4: Rank, Quick Links, Next Problem */}
        <div className="grid grid-cols-1 lg:grid-cols-[40%_30%_40%] gap-6 mb-8">
          {/* Your Rank */}
          <div className="rounded-lg border border-white/[0.06] bg-surface p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Your Rank</h3>
            <div className="text-3xl font-bold text-accent mb-2">Top {percentile}%</div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div className="bg-accent h-2 rounded-full" style={{ width: `${percentile}%` }} />
            </div>
            <p className="text-sm text-text-tertiary">ELO: {elo}</p>
          </div>

          {/* Quick Links */}
          <div className="rounded-lg border border-white/[0.06] bg-surface p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Quick Links</h3>
            <div className="flex flex-col gap-3">
              <Link to="/problems" className="flex items-center justify-between text-text-primary hover:text-accent transition-colors">
                Practice Problems <span className="text-accent">→</span>
              </Link>
              <Link to="/tracks" className="flex items-center justify-between text-text-primary hover:text-accent transition-colors">
                View Tracks <span className="text-accent">→</span>
              </Link>
              <Link to="/profile" className="flex items-center justify-between text-text-primary hover:text-accent transition-colors">
                My Profile <span className="text-accent">→</span>
              </Link>
            </div>
          </div>

          {/* Next Problem */}
          <div className="rounded-lg border border-white/[0.06] bg-surface p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Next Problem</h3>
            {randomProblem ? (
              <Link to={`/problems/${randomProblem._id}`} className="flex items-center justify-between text-text-primary hover:text-accent transition-colors">
                <span>{randomProblem.title}</span> <span className="text-accent">→</span>
              </Link>
            ) : (
              <Link to="/problems" className="flex items-center justify-between text-text-primary hover:text-accent transition-colors">
                Practice Problems <span className="text-accent">→</span>
              </Link>
            )}
          </div>
        </div>

        {/* Heatmap */}
        {sortedSessions.length > 0 && <div className="mb-8"><ContributionHeatmap sessions={sortedSessions} /></div>}

        {/* Recent Sessions */}
        <div className="rounded-lg border border-white/[0.06] bg-surface p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">Recent Sessions</h3>
          {sortedSessions.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-text-tertiary mb-4">No sessions yet. Start practicing to see your progress!</p>
              <Link to="/match" className="btn-primary">Start Practicing</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-3 px-4 font-semibold text-text-tertiary">Problem</th>
                      <th className="text-left py-3 px-4 font-semibold text-text-tertiary">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-text-tertiary">Duration</th>
                      <th className="text-right py-3 px-4 font-semibold text-text-tertiary">ELO CHANGE</th>
                      <th className="text-right py-3 px-4 font-semibold text-text-tertiary">ACTION</th>
                    </tr>
                </thead>
                <tbody>
                  {sortedSessions.slice(0, 10).map(s => (
                    <tr key={s._id} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-text-primary">{s.problemSnapshot?.title || 'Unknown'}</td>
                      <td className="py-3 px-4">
                        <span className={s.testResults?.allPassed ? 'text-green-400' : 'text-red-400'}>
                          {s.testResults?.allPassed ? '✓ Accepted' : '✗ Wrong Answer'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-tertiary">{Math.round((s.duration || 0) / 60)}m</td>
                      <td className="py-3 px-4 text-right">
                        {s.eloDelta != null ? (
                          <span className={s.eloDelta >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {s.eloDelta >= 0 ? '+' : ''}{s.eloDelta}
                          </span>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/debrief/${s.roomId || s._id}`} className="text-accent hover:text-[#7c5ff5] transition-colors text-sm">
                          View Debrief →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
