import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Code2, LayoutDashboard, BookOpen, Layers, Trophy, Bot, Shield, Award,
  Menu, X, ChevronLeft, ChevronRight, User, LogOut, Crown, Users,
  ChevronDown, WifiOff,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { THEME_CONFIG } from './ThemeToggle'
import { useTheme } from '../../context/ThemeContext'
import NotificationCenter from './NotificationCenter'
import LogoutConfirmModal from './LogoutConfirmModal'

const COLLAPSE_KEY = 'peercode_sidebar_collapsed'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { isConnected } = useSocket()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1' } catch { return false }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar', collapsed ? 'collapsed' : 'expanded')
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0') } catch (_) {}
  }, [collapsed])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const navLinks = [
    ...(user ? [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { to: '/problems', label: 'Problems', icon: BookOpen },
    { to: '/tracks', label: 'Tracks', icon: Layers },
    { to: '/contests', label: 'Contests', icon: Award },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/ai-interview', label: 'AI Interview', icon: Bot },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ]

  const handleLogoutClick = () => setShowLogoutModal(true)
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      setShowLogoutModal(false)
      navigate('/')
    } catch (_) {
      setIsLoggingOut(false)
    }
  }
  const handleCancelLogout = () => {
    setShowLogoutModal(false)
    setUserMenuOpen(false)
  }

  const planBadge = user?.subscription?.plan && user.subscription.plan !== 'free' ? user.subscription.plan : null

  return (
    <>
      {/* Mobile slim top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 navbar-bg backdrop-blur-xl border-b border-border-default flex items-center justify-between px-3">
        <button
          aria-label="Open navigation menu"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Code2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-text-primary">PeerCode</span>
        </Link>
        <div className="flex items-center gap-1">
          {user && <NotificationCenter />}
          {!user && (
            <Link to="/?register=1" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white">
              Join
            </Link>
          )}
        </div>
      </header>
      {!isConnected && user && (
        <div className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-amber-900/30 border-b border-amber-800/50 px-4 py-1.5 flex items-center gap-2 text-xs text-amber-300">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Reconnecting...</span>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-72 shadow-2xl overflow-y-auto bg-bg-base border-r border-border-default flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-border-default flex-shrink-0">
              <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-text-primary">PeerCode</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="px-3 py-4 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to) ? 'text-sky-400 bg-sky-500/10' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="px-4 py-3 border-t border-border-default">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Theme</p>
              <div className="grid grid-cols-2 gap-2">
                {THEME_CONFIG.map(({ key, icon: Icon, label, gradient }) => {
                  const isActiveTheme = theme === key
                  return (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActiveTheme ? `bg-gradient-to-r ${gradient} text-white` : 'bg-bg-elevated text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {user ? (
              <div className="mt-auto px-3 pb-4 pt-3 border-t border-border-default space-y-1">
                <div className="px-3 py-2 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{user.username}</p>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                </div>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <Link to="/subscription" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-500/10 transition-colors">
                  <Crown className="w-4 h-4" /> Upgrade
                </Link>
                <Link to="/find-partner" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-violet-600 text-white">
                  <Users className="w-4 h-4" /> Practice with Partner
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleLogoutClick() }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="mt-auto px-3 pb-4 pt-3 border-t border-border-default space-y-2">
                <Link to="/" onClick={() => setMobileOpen(false)} className="block text-center px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors">
                  Sign In
                </Link>
                <Link to="/?register=1" onClick={() => setMobileOpen(false)} className="block text-center px-3 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-40 flex-col bg-bg-surface border-r border-border-default transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
          collapsed ? 'w-20' : 'w-[248px]'
        }`}
      >
        <div className={`flex items-center h-16 flex-shrink-0 border-b border-border-default ${collapsed ? 'justify-center' : 'px-4'}`}>
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            {!collapsed && <span className="font-bold text-lg text-text-primary whitespace-nowrap">PeerCode</span>}
          </Link>
        </div>

        {!isConnected && user && !collapsed && (
          <div className="px-3 py-2 mx-3 mt-3 rounded-lg bg-amber-900/30 border border-amber-800/50 flex items-center gap-2 text-xs text-amber-300">
            <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Reconnecting...</span>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive(to) ? 'text-sky-400 bg-sky-500/10' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              {isActive(to) && (
                <span className={`absolute ${collapsed ? 'left-0 top-1/2 -translate-y-1/2 w-0.5 h-5' : 'left-0 top-1/2 -translate-y-1/2 w-0.5 h-5'} rounded-full bg-sky-400`} />
              )}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border-default flex-shrink-0">
          {!collapsed && <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">Theme</p>}
          <div className={collapsed ? 'flex flex-col gap-1' : 'grid grid-cols-2 gap-1.5'}>
            {THEME_CONFIG.map(({ key, icon: Icon, label, gradient }) => {
              const isActiveTheme = theme === key
              return (
                <button
                  key={key}
                  title={label}
                  aria-label={`${label} theme`}
                  onClick={() => setTheme(key)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActiveTheme ? `bg-gradient-to-r ${gradient} text-white shadow-sm` : 'bg-bg-elevated text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-3 py-3 border-t border-border-default flex-shrink-0">
          {user ? (
            <div className="relative" ref={userMenuRef}>
              {userMenuOpen && (
                <div className={`absolute bottom-full mb-2 ${collapsed ? 'left-0' : 'left-0 right-0'} w-56 rounded-xl shadow-2xl overflow-hidden bg-bg-elevated border border-border-default`}>
                  <div className="px-4 py-3 border-b border-border-default">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-text-primary truncate">{user.username}</p>
                      {planBadge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-500/20 text-amber-400">
                          {planBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link to="/subscription" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-500/10 transition-colors">
                    <Crown className="w-4 h-4" /> Upgrade
                  </Link>
                  <Link to="/find-partner" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-violet-500 hover:bg-violet-500/10 transition-colors">
                    <Users className="w-4 h-4" /> Practice with Partner
                  </Link>
                  <div className="border-t border-border-default">
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogoutClick() }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="User menu"
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors ${collapsed ? 'justify-center' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  {planBadge && (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-bg-surface bg-amber-400 flex items-center justify-center">
                      <Crown className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{user.username}</span>
                    <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className={collapsed ? 'space-y-2' : 'space-y-2'}>
              <Link to="/" className={`block text-center px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors ${collapsed ? 'px-1' : ''}`}>
                {collapsed ? <User className="w-4 h-4 mx-auto" /> : 'Sign In'}
              </Link>
              {!collapsed && (
                <Link to="/?register=1" className="block text-center px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white">
                  Get Started
                </Link>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-strong transition-colors shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
        isLoading={isLoggingOut}
      />
    </>
  )
}
