import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  FileCode2,
  Flag,
  LayoutDashboard,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Users,
  DollarSign,
  Crown,
  Gem,
  CreditCard,
  TrendingUp,
  BarChart2,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Skeleton from '../components/common/Skeleton'
import {
  getAdminProblems,
  getAdminReports,
  getAdminStats,
  getAdminUsers,
  getErrorMessage,
  resolveAdminReport,
  softDeleteProblem,
  toggleBanUser,
} from '../services/api'
import { logger } from '../utils/logger'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'subscriptions', label: 'Subscriptions', icon: Crown },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'problems', label: 'Problems', icon: FileCode2 },
  { id: 'reports', label: 'Reports', icon: Flag },
]

function StatCard({ label, value, detail, icon: Icon, tone = 'indigo' }) {
  const tones = {
    indigo: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
    green: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
    pink: 'text-pink-300 bg-pink-500/10 border-pink-500/20',
    red: 'text-red-300 bg-red-500/10 border-red-500/20',
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-100">{value}</p>
          {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
        </div>
        <div className={`p-2.5 rounded-lg border ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ title, body }) {
  return (
    <div className="py-14 text-center">
      <p className="text-sm font-semibold text-gray-300">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{body}</p>
    </div>
  )
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [problems, setProblems] = useState([])
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState(null)

  async function loadAdminData() {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, usersRes, problemsRes, reportsRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers({ limit: 50, search: search || undefined }),
        getAdminProblems(),
        getAdminReports(),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data.users || [])
      setProblems(problemsRes.data || [])
      setReports(reportsRes.data || [])
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to load admin dashboard')
      setError(message)
      logger.error('Failed to load admin dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const filteredProblems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return problems
    return problems.filter(problem =>
      [problem.title, problem.slug, problem.difficulty]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query))
    )
  }, [problems, search])

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return reports
    return reports.filter(report =>
      [report.type, report.description, report.problem?.title, report.reportedBy?.username]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query))
    )
  }, [reports, search])

  const sessionChart = stats?.sessionsPerDay || []
  const difficultyChart = useMemo(() => {
    const counts = problems.reduce((acc, problem) => {
      const key = problem.difficulty || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return ['easy', 'medium', 'hard'].map(name => ({ name, count: counts[name] || 0 }))
  }, [problems])

  async function handleToggleBan(userId) {
    setActionId(userId)
    try {
      await toggleBanUser(userId)
      toast.success('User status updated')
      await loadAdminData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update user'))
    } finally {
      setActionId(null)
    }
  }

  async function handleDeleteProblem(problemId) {
    setActionId(problemId)
    try {
      await softDeleteProblem(problemId)
      toast.success('Problem archived')
      await loadAdminData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to archive problem'))
    } finally {
      setActionId(null)
    }
  }

  async function handleResolveReport(reportId) {
    setActionId(reportId)
    try {
      await resolveAdminReport(reportId)
      toast.success('Report resolved')
      await loadAdminData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to resolve report'))
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold">
              <Shield className="w-4 h-4" />
              Admin Command Center
            </div>
            <h1 className="mt-2 text-3xl font-bold text-gray-100">Platform Operations</h1>
            <p className="mt-1 text-sm text-gray-500">Monitor health, moderate content, and keep practice sessions running cleanly.</p>
          </div>
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm font-semibold text-gray-200 hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          {activeTab !== 'overview' && (
            <div className="relative md:ml-auto md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="input-field pl-9"
                placeholder={`Search ${activeTab}`}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-800 rounded-lg text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
            <Skeleton className="h-72 w-full" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard label="Users" value={stats?.totalUsers ?? 0} detail="Registered accounts" icon={Users} />
                  <StatCard label="Sessions" value={stats?.totalSessions ?? 0} detail={`${stats?.activeTodayCount ?? 0} started today`} icon={Activity} tone="green" />
                  <StatCard label="Problems" value={stats?.totalProblems ?? 0} detail="Active problem bank" icon={FileCode2} tone="amber" />
                  <StatCard label="Active Rooms" value={stats?.activeRooms ?? 0} detail="Waiting or live rooms" icon={AlertTriangle} tone={stats?.activeRooms > 0 ? 'green' : 'red'} />
                </div>

                {/* Subscription Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard
                    label="Pro Subscribers"
                    value={stats?.subscriptionStats?.pro || 0}
                    detail="₹99/month plan"
                    icon={Gem}
                    tone="amber"
                  />
                  <StatCard
                    label="Premium Subscribers"
                    value={stats?.subscriptionStats?.premium || 0}
                    detail="₹299/month plan"
                    icon={Crown}
                    tone="purple"
                  />
                  <StatCard
                    label="Ultra Subscribers"
                    value={stats?.subscriptionStats?.ultra || 0}
                    detail="₹999/month plan"
                    icon={DollarSign}
                    tone="pink"
                  />
                  <StatCard
                    label="Monthly Revenue"
                    value={`₹${(stats?.subscriptionStats?.monthlyRevenue || 0).toLocaleString('en-IN')}`}
                    detail={`${stats?.subscriptionStats?.total || 0} total paid subscriptions`}
                    icon={CreditCard}
                    tone="green"
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <section className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-gray-200">Sessions, Last 7 Days</h2>
                      <span className="text-xs text-gray-500">UTC</span>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sessionChart}>
                          <XAxis dataKey="_id" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                          <Area type="monotone" dataKey="count" stroke="#818cf8" fill="#4f46e5" fillOpacity={0.25} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                    <h2 className="text-sm font-semibold text-gray-200 mb-4">Problem Mix</h2>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={difficultyChart}>
                          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                          <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard
                    label="Pro Subscribers"
                    value={stats?.subscriptionStats?.pro || 0}
                    detail="₹99/month plan"
                    icon={Gem}
                    tone="amber"
                  />
                  <StatCard
                    label="Premium Subscribers"
                    value={stats?.subscriptionStats?.premium || 0}
                    detail="₹299/month plan"
                    icon={Crown}
                    tone="purple"
                  />
                  <StatCard
                    label="Ultra Subscribers"
                    value={stats?.subscriptionStats?.ultra || 0}
                    detail="₹999/month plan"
                    icon={DollarSign}
                    tone="pink"
                  />
                  <StatCard
                    label="Monthly Revenue"
                    value={`₹${(stats?.subscriptionStats?.monthlyRevenue || 0).toLocaleString('en-IN')}`}
                    detail={`${stats?.subscriptionStats?.total || 0} total paid subscriptions`}
                    icon={CreditCard}
                    tone="green"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                    <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      Revenue by Plan
                    </h2>
                    <div className="space-y-3">
                      {[
                        { name: 'Pro', count: stats?.subscriptionStats?.pro || 0, price: 99, color: 'amber' },
                        { name: 'Premium', count: stats?.subscriptionStats?.premium || 0, price: 299, color: 'purple' },
                        { name: 'Ultra', count: stats?.subscriptionStats?.ultra || 0, price: 999, color: 'pink' },
                      ].map(plan => {
                        const revenue = plan.count * plan.price
                        return (
                          <div key={plan.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${plan.color}-500/20`}>
                                {plan.name === 'Pro' && <Gem className={`w-4 h-4 text-${plan.color}-400`} />}
                                {plan.name === 'Premium' && <Crown className={`w-4 h-4 text-${plan.color}-400`} />}
                                {plan.name === 'Ultra' && <DollarSign className={`w-4 h-4 text-${plan.color}-400`} />}
                              </div>
                              <div>
                                <p className="font-medium text-gray-100">{plan.name}</p>
                                <p className="text-xs text-gray-500">₹{plan.price}/mo × {plan.count}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-100">₹{revenue.toLocaleString('en-IN')}</p>
                              <p className="text-xs text-gray-500">/month</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                    <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-emerald-400" />
                      Growth Metrics
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-400">
                          {stats?.subscriptionStats?.total || 0}
                        </p>
                        <p className="text-xs text-gray-500">Total Paid Subscribers</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-indigo-400">
                          {(((stats?.subscriptionStats?.pro || 0) + (stats?.subscriptionStats?.premium || 0) + (stats?.subscriptionStats?.ultra || 0)) / Math.max(stats?.totalUsers || 1, 1) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">Conversion Rate</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-amber-400">
                          {stats?.totalUsers || 0}
                        </p>
                        <p className="text-xs text-gray-500">Total Users</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-violet-400">
                          ₹{(stats?.subscriptionStats?.monthlyRevenue || 0) * 12}
                        </p>
                        <p className="text-xs text-gray-500">Annual Run Rate</p>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-indigo-400" />
                      Recent Subscriptions
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/60">
                        <tr>
                          {['User', 'Plan', 'Status', 'Period', 'Action'].map(header => (
                            <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        <tr>
                          <td className="px-5 py-4" colSpan={5}>
                            <div className="text-center py-8 text-gray-500">
                              <Crown className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                              <p>Subscription details table requires additional API endpoint</p>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'users' && (
              <section className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/60">
                      <tr>
                        {['User', 'Role', 'ELO', 'Status', 'Joined', 'Action'].map(header => (
                          <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {users.map(user => (
                        <tr key={user._id} className="hover:bg-gray-800/30">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-100">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-300 uppercase">{user.role}</td>
                          <td className="px-5 py-4 text-sm text-gray-300">{user.elo ?? 1200}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isBanned ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                              {user.isBanned ? 'Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleToggleBan(user._id)}
                              disabled={actionId === user._id || user.role === 'admin'}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-xs font-semibold text-gray-200"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              {user.isBanned ? 'Unban' : 'Ban'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {users.length === 0 && <EmptyState title="No users found" body="Try a different search query." />}
              </section>
            )}

            {activeTab === 'problems' && (
              <section className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/60">
                      <tr>
                        {['Problem', 'Difficulty', 'Status', 'Action'].map(header => (
                          <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredProblems.map(problem => (
                        <tr key={problem._id} className="hover:bg-gray-800/30">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-100">{problem.title}</p>
                            <p className="text-xs text-gray-500">{problem.slug}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="capitalize text-sm text-gray-300">{problem.difficulty}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${problem.isActive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-gray-700 text-gray-400'}`}>
                              {problem.isActive ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleDeleteProblem(problem._id)}
                              disabled={actionId === problem._id || !problem.isActive}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-900/50 disabled:opacity-50 text-xs font-semibold text-red-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Archive
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredProblems.length === 0 && <EmptyState title="No problems found" body="Try a different search query." />}
              </section>
            )}

            {activeTab === 'reports' && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredReports.map(report => (
                  <article key={report._id} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-300">{report.type}</p>
                        <h3 className="mt-1 text-lg font-semibold text-gray-100">{report.problem?.title || 'Unknown problem'}</h3>
                        <p className="mt-1 text-xs text-gray-500">Reported by {report.reportedBy?.username || 'Unknown'}</p>
                      </div>
                      <button
                        onClick={() => handleResolveReport(report._id)}
                        disabled={actionId === report._id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-gray-300">{report.description}</p>
                  </article>
                ))}
                {filteredReports.length === 0 && (
                  <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg">
                    <EmptyState title="No open reports" body="The problem bank is clear right now." />
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
