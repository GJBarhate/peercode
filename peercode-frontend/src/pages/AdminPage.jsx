import { useEffect, useMemo, useState, useCallback } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'
import { Helmet } from 'react-helmet-async'
import Papa from 'papaparse'
import FocusTrap from 'focus-trap-react'
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Download,
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
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import {
  getAdminProblems,
  getAdminReports,
  getAdminStats,
  getAdminUsers,
  getErrorMessage,
  resolveAdminReport,
  softDeleteProblem,
  updateAdminProblem,
  toggleBanUser,
} from '../services/api'
import AddEditProblemModal from '../components/admin/AddEditProblemModal'
import { logger } from '../utils/logger'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'subscriptions', label: 'Subscriptions', icon: Crown },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'problems', label: 'Problems', icon: FileCode2 },
  { id: 'reports', label: 'Reports', icon: Flag },
]


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
  const [showProblemModal, setShowProblemModal] = useState(false)
  const [editProblem, setEditProblem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function loadAdminData() {
    setLoading(true)
    setError(null)
    const [statsResult, usersResult, problemsResult, reportsResult] = await Promise.allSettled([
      getAdminStats(),
      getAdminUsers({ limit: 50, search: search || undefined }),
      getAdminProblems(),
      getAdminReports(),
    ])
    if (statsResult.status === 'fulfilled') setStats(statsResult.value.data)
    else logger.error('Failed to load stats:', statsResult.reason)
    if (usersResult.status === 'fulfilled') setUsers(usersResult.value.data.users || [])
    else logger.error('Failed to load users:', usersResult.reason)
    if (problemsResult.status === 'fulfilled') setProblems(problemsResult.value.data || [])
    else logger.error('Failed to load problems:', problemsResult.reason)
    if (reportsResult.status === 'fulfilled') setReports(reportsResult.value.data || [])
    else logger.error('Failed to load reports:', reportsResult.reason)

    const anyFailed = [statsResult, usersResult, problemsResult, reportsResult].some(r => r.status === 'rejected')
    if (anyFailed) setError('Some data failed to load — showing partial results')
    setLoading(false)
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

  const paidUsers = useMemo(() => users.filter(u => u.subscription?.plan && u.subscription.plan !== 'free'), [users])

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

  async function handleToggleProblem(problemId, isActive) {
    setActionId(problemId)
    try {
      if (isActive) {
        await softDeleteProblem(problemId)
        toast.success('Problem archived')
      } else {
        await updateAdminProblem(problemId, { isActive: true })
        toast.success('Problem restored')
      }
      await loadAdminData()
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to ${isActive ? 'archive' : 'restore'} problem`))
    } finally {
      setActionId(null)
    }
  }

  function handleProblemSaved() {
    loadAdminData()
  }

  const exportCSV = useCallback((dataArray, filename) => {
    if (!dataArray?.length) return toast.error('No data to export')
    const csv = Papa.unparse(dataArray)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${dataArray.length} rows`)
  }, [])

  const exportUsers = useCallback(() => {
    exportCSV(users.map(u => ({
      Username: u.username,
      Email: u.email,
      Role: u.role,
      ELO: u.elo || 1200,
      Plan: u.subscription?.plan || 'free',
      Status: u.isBanned ? 'Banned' : 'Active',
      Sessions: u.sessionCount || 0,
      Joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
    })), 'peercode_users')
  }, [users, exportCSV])

  const exportProblems = useCallback(() => {
    exportCSV(problems.map(p => ({
      Title: p.title,
      Slug: p.slug,
      Difficulty: p.difficulty,
      Status: p.isActive ? 'Active' : 'Archived',
      Tags: (p.tags || []).join(', '),
    })), 'peercode_problems')
  }, [problems, exportCSV])

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Helmet>
        <title>Admin — PeerCode</title>
        <meta name="description" content="PeerCode admin dashboard for platform operations." />
      </Helmet>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold">
              <Shield className="w-4 h-4" />
              Admin Command Center
            </div>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">Platform Operations</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-500">Monitor health, moderate content, and keep practice sessions running cleanly.</p>
          </div>
          <button
            onClick={loadAdminData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex gap-1 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          {activeTab !== 'overview' && (
            <div className="relative md:ml-auto md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-gray-500" />
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
          <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-200">
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

                {/* Engagement metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard label="AI Interviews" value={stats?.totalInterviews ?? 0} detail="Mock interviews completed" icon={Activity} tone="purple" />
                  <StatCard label="Pair Sessions" value={stats?.totalCollabSessions ?? 0} detail="Sessions with 2+ participants" icon={Users} tone="indigo" />
                  <StatCard label="Ratings Submitted" value={stats?.totalRatings ?? 0} detail="Post-session reviews" icon={CheckCircle2} tone="green" />
                  <StatCard label="Avg Rating" value={stats?.avgRating != null ? `${stats.avgRating} / 5` : '—'} detail="Across all reviews" icon={TrendingUp} tone="amber" />
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
                  <section className="xl:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Sessions, Last 7 Days</h2>
                      <span className="text-xs text-gray-600 dark:text-gray-500">UTC</span>
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

                  <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Problem Mix</h2>
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
                  <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
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
                          <div key={plan.name} className="flex items-center justify-between p-3 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                plan.color === 'amber' ? 'bg-amber-500/20' : plan.color === 'purple' ? 'bg-purple-500/20' : 'bg-pink-500/20'
                              }`}>
                                {plan.name === 'Pro' && <Gem className={`w-4 h-4 ${
                                  plan.color === 'amber' ? 'text-amber-400' : plan.color === 'purple' ? 'text-purple-400' : 'text-pink-400'
                                }`} />}
                                {plan.name === 'Premium' && <Crown className={`w-4 h-4 ${
                                  plan.color === 'amber' ? 'text-amber-400' : plan.color === 'purple' ? 'text-purple-400' : 'text-pink-400'
                                }`} />}
                                {plan.name === 'Ultra' && <DollarSign className={`w-4 h-4 ${
                                  plan.color === 'amber' ? 'text-amber-400' : plan.color === 'purple' ? 'text-purple-400' : 'text-pink-400'
                                }`} />}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{plan.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-500">₹{plan.price}/mo × {plan.count}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-gray-100">₹{revenue.toLocaleString('en-IN')}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-500">/month</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-emerald-400" />
                      Growth Metrics
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-400">
                          {stats?.subscriptionStats?.total || 0}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-500">Total Paid Subscribers</p>
                      </div>
                      <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-indigo-400">
                          {(((stats?.subscriptionStats?.pro || 0) + (stats?.subscriptionStats?.premium || 0) + (stats?.subscriptionStats?.ultra || 0)) / Math.max(stats?.totalUsers || 1, 1) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-500">Conversion Rate</p>
                      </div>
                      <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-amber-400">
                          {stats?.totalUsers || 0}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-500">Total Users</p>
                      </div>
                      <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-violet-400">
                          ₹{(stats?.subscriptionStats?.monthlyRevenue || 0) * 12}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-500">Annual Run Rate</p>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-indigo-400" />
                      Recent Subscriptions
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/60">
                        <tr>
                          {['User', 'Email', 'Plan', 'ELO', 'Sessions', 'Joined'].map(header => (
                            <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {paidUsers.length === 0 ? (
                          <tr>
                            <td className="px-5 py-4" colSpan={6}>
                              <div className="text-center py-8 text-gray-600 dark:text-gray-500">
                                <Crown className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-700" />
                                <p>No paid subscribers yet</p>
                              </div>
                            </td>
                          </tr>
                        ) : paidUsers.map(u => {
                          const planColors = { pro: 'text-amber-400 bg-amber-500/10', premium: 'text-purple-400 bg-purple-500/10', ultra: 'text-pink-400 bg-pink-500/10' }
                          const planColor = planColors[u.subscription?.plan] || 'text-gray-400 bg-gray-500/10'
                          return (
                            <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                                    {u.username?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.username}</span>
                                  {u.isBanned && <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Banned</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{u.email}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${planColor}`}>
                                  {u.subscription?.plan}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-indigo-400">{u.elo || 1200}</td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{u.sessionCount || 0}</td>
                              <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'users' && (
              <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Users ({users.length})</h3>
                  <button onClick={exportUsers} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/60">
                      <tr>
                        {['User', 'Role', 'ELO', 'Status', 'Joined', 'Action'].map(header => (
                          <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {users.map(user => (
                        <tr key={user._id} className="hover:bg-gray-100/50 dark:hover:bg-gray-800/30">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.username}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-500">{user.email}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 uppercase">{user.role}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{user.elo ?? 1200}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isBanned ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300' : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
                              {user.isBanned ? 'Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleToggleBan(user._id)}
                              disabled={actionId === user._id || user.role === 'admin'}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-xs font-semibold text-gray-800 dark:text-gray-200"
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
                {users.length === 0 && <EmptyState title="No users found" description="Try a different search query." />}
              </section>
            )}

            {activeTab === 'problems' && (
              <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Problems ({filteredProblems.length})</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={exportProblems} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                    <button onClick={() => { setEditProblem(null); setShowProblemModal(true) }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors">
                      + Add Problem
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/60">
                      <tr>
                        {['Problem', 'Difficulty', 'Status', 'Actions'].map(header => (
                          <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {filteredProblems.map(problem => (
                        <tr key={problem._id} className="hover:bg-gray-100/50 dark:hover:bg-gray-800/30">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{problem.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-500">{problem.slug}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="capitalize text-sm text-gray-700 dark:text-gray-300">{problem.difficulty}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${problem.isActive ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                              {problem.isActive ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setEditProblem(problem); setShowProblemModal(true) }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <FileCode2 className="w-3 h-3" /> Edit
                              </button>
                              <button onClick={() => problem.isActive ? setConfirmDelete(problem) : handleToggleProblem(problem._id, false)}
                                disabled={actionId === problem._id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${problem.isActive
                                  ? 'bg-red-50/80 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-200'
                                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'}`}>
                                {problem.isActive ? <Trash2 className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                                {problem.isActive ? 'Archive' : 'Restore'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredProblems.length === 0 && <EmptyState title="No problems found" description="Try a different search query." />}
              </section>
            )}

            {activeTab === 'reports' && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredReports.map(report => (
                  <article key={report._id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">{report.type}</p>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{report.problem?.title || 'Unknown problem'}</h3>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-500">Reported by {report.reportedBy?.username || 'Unknown'}</p>
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
                    <p className="mt-4 text-sm leading-6 text-gray-700 dark:text-gray-300">{report.description}</p>
                  </article>
                ))}
                {filteredReports.length === 0 && (
                  <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                    <EmptyState title="No open reports" description="The problem bank is clear right now." />
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <AddEditProblemModal
        isOpen={showProblemModal}
        onClose={() => { setShowProblemModal(false); setEditProblem(null) }}
        problem={editProblem}
        onSaved={handleProblemSaved}
      />
      {confirmDelete && (
        <FocusTrap>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Archive problem?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">This will hide the problem from users.</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-5 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              "{confirmDelete.title}"
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleToggleProblem(confirmDelete._id, true); setConfirmDelete(null) }}
                disabled={actionId === confirmDelete._id}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}
    </div>
  )
}
