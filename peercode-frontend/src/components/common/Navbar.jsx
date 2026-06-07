import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Code2, LayoutDashboard, BookOpen, User, LogOut, Menu, X, ChevronDown, Layers, Shield, Wifi, WifiOff, Users, Crown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import LogoutConfirmModal from './LogoutConfirmModal'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isConnected } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
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
      console.error('Logout error:', err)
      setIsLoggingOut(false)
    }
  }

  const handleCancelLogout = () => {
    setShowLogoutModal(false)
    setUserMenuOpen(false)
  }

  const navLinks = [
    { to: '/problems', label: 'Problems', icon: BookOpen },
    { to: '/tracks', label: 'Tracks', icon: Layers }
  ]

  const mobileLinks = [
    ...navLinks,
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/subscription', label: 'Upgrade', icon: Crown }
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-950/90 border-b border-gray-800/60 backdrop-blur-md">
      {/* Disconnection Banner */}
      {!isConnected && user && (
        <div className="bg-amber-900/30 border-b border-amber-800/50 px-4 py-2 flex items-center gap-2 text-xs text-amber-300">
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
            <span className="font-bold text-lg text-gray-100">PeerCode</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'text-violet-400'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {isActive(to) && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-500 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <Link
                  to="/find-partner"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  Find Partner
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block">{user.username}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-sm font-semibold text-gray-100">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-indigo-400 font-medium">ELO {user.elo || 1200}</span>
                          <div className="flex items-center gap-1">
                            {isConnected ? (
                              <>
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs text-green-400">Connected</span>
                              </>
                            ) : (
                              <>
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                <span className="text-xs text-amber-400">Connecting...</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                       <div>
                         <button
                           onClick={() => { setUserMenuOpen(false); navigate('/dashboard') }}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                         >
                           <LayoutDashboard className="w-4 h-4" />
                           Dashboard
                         </button>
                         <button
                           onClick={() => { setUserMenuOpen(false); navigate('/profile') }}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                         >
                           <User className="w-4 h-4" />
                           Profile
                         </button>
                         <button
                           onClick={() => { setUserMenuOpen(false); navigate('/subscription') }}
                           className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-900/20 hover:text-amber-300 transition-colors"
                         >
                           <Crown className="w-4 h-4" />
                           Upgrade
                         </button>
                       </div>
                      {user.role === 'admin' && (
                        <button
                          onClick={() => { setUserMenuOpen(false); navigate('/admin') }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </button>
                      )}
                      <div className="border-t border-gray-800">
                        <button
                          onClick={handleLogoutClick}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                          aria-label="Open sign out confirmation"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-800 transition-colors">
                  Sign In
                </Link>
                <Link to="/?register=1" className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                  Get Started
                </Link>
              </div>
            )}

            <button
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
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
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-gray-950 border-r border-gray-800 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800">
              <Link to="/" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-100">PeerCode</span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
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
                    isActive(to) ? 'text-violet-400 bg-violet-500/10' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
            {user && (
              <div className="px-3 pb-4">
                <div className="border-t border-gray-800 pt-3">
                  <button
                    onClick={() => { setMenuOpen(false); handleLogoutClick() }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
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
