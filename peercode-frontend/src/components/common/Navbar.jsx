import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Code2, LayoutDashboard, BookOpen, User, LogOut, Menu, X, ChevronDown, Layers, Shield, Wifi, WifiOff, Users, Crown, Bot, Trophy } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import ThemeToggle from './ThemeToggle'
import LogoutConfirmModal from './LogoutConfirmModal'
import NotificationCenter from './NotificationCenter'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isConnected } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      setShowLogoutModal(false)
      navigate('/')
    } catch (err) {
      setIsLoggingOut(false)
    }
  }

  const handleCancelLogout = () => {
    setShowLogoutModal(false)
    setUserMenuOpen(false)
  }

  const navLinks = [
    ...(user ? [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { to: '/problems', label: 'Problems', icon: BookOpen },
    { to: '/tracks', label: 'Tracks', icon: Layers },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/ai-interview', label: 'AI Interview', icon: Bot },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: Shield }] : [])
  ]

  const mobileLinks = [
    ...navLinks,
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/subscription', label: 'Upgrade', icon: Crown }
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 navbar-bg transition-all duration-300 ${scrolled ? 'backdrop-blur-xl shadow-lg border-b border-white/10' : 'backdrop-blur-md'}`}>
      {/* Disconnection Banner */}
      {!isConnected && user && (
        <div className="bg-amber-900/30 dark:bg-amber-900/30 border-b border-amber-800/50 px-4 py-2 flex items-center gap-2 text-xs text-amber-300">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Connection lost - attempting to reconnect...</span>
        </div>
      )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[52px]">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">PeerCode</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                  isActive(to)
                    ? 'text-sky-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full origin-left transition-transform duration-200 ${
                  isActive(to) ? 'bg-violet-500 scale-x-100' : 'bg-indigo-500 scale-x-0 group-hover:scale-x-100'
                }`} />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user && <NotificationCenter />}
            {user ? (
              <>
                <Link
                  to="/find-partner"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  Practice with Partner
                </Link>

                <Link
                  to="/subscription"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade
                </Link>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-label="User menu"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      {user.subscription?.plan && user.subscription.plan !== 'free' && (
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-gray-900 flex items-center justify-center ${
                          user.subscription.plan === 'pro' ? 'bg-amber-400'
                          : user.subscription.plan === 'premium' ? 'bg-purple-500'
                          : 'bg-pink-500'
                        }`}>
                          <Crown className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="hidden sm:block">{user.username}</span>
                    {user.subscription?.plan && user.subscription.plan !== 'free' && (
                      <span className={`hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        user.subscription.plan === 'pro' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : user.subscription.plan === 'premium' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      }`}>
                        {user.subscription.plan}
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {userMenuOpen && (
                    <div role="menu" className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.username}</p>
                          {user.subscription?.plan && user.subscription.plan !== 'free' && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              user.subscription.plan === 'pro' ? 'bg-amber-500/20 text-amber-400'
                              : user.subscription.plan === 'premium' ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-pink-500/20 text-pink-400'
                            }`}>
                              {user.subscription.plan}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">ELO {user.elo || 1200}</span>
                          <div className="flex items-center gap-1">
                            {isConnected ? (
                              <>
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
                              </>
                            ) : (
                              <>
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                <span className="text-xs text-amber-600 dark:text-amber-400">Connecting...</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                       <div>
                        <button
                          role="menuitem"
                          onClick={() => { setUserMenuOpen(false); navigate('/dashboard') }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => { setUserMenuOpen(false); navigate('/profile') }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            role="menuitem"
                            onClick={() => { setUserMenuOpen(false); navigate('/admin') }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:text-purple-900 dark:hover:text-purple-300 transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </button>
                        )}
                        <button
                          role="menuitem"
                          onClick={() => { setUserMenuOpen(false); navigate('/subscription') }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade
                        </button>
                        <div className="border-t border-gray-200 dark:border-gray-800 mt-1 pt-1">
                          <button
                            role="menuitem"
                            onClick={() => { setUserMenuOpen(false); handleLogoutClick() }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-800 dark:hover:text-red-300 transition-colors rounded-lg"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                     </div>
                   )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">
                  Sign In
                </Link>
                <Link to="/?register=1" className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                  Get Started
                </Link>
              </div>
            )}

            <button
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              className="lg:hidden p-2 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMenuOpen(v => !v)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-72 shadow-2xl overflow-y-auto bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-800">
              <Link to="/" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">PeerCode</span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-3 py-4 space-y-1">
              {mobileLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to) ? 'text-sky-400 bg-sky-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
            {user && (
              <div className="px-3 pb-4">
                <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
                  <button
                    onClick={() => { setMenuOpen(false); handleLogoutClick() }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
        isLoading={isLoggingOut}
      />
    </nav>
  )
}
