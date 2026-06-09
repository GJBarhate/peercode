import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Code2, Video, Users, Brain, BarChart3, ArrowRight, X, Eye, EyeOff, Chrome } from 'lucide-react'
import MatchingQueue from '../components/room/MatchingQueue'
import Spinner from '../components/common/Spinner'
import HeroIllustration from '../components/common/HeroIllustration'
import { useAuth } from '../context/AuthContext'
import { validateLoginForm, validateRegisterForm, validatePassword } from '../utils/validation'
import { getErrorMessage, googleAuth } from '../services/api'
import toast from 'react-hot-toast'

export default function HomePage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const showRegister = searchParams.get('register') === '1'
  const [isLogin, setIsLogin] = useState(!showRegister)
  const [isLoading, setIsLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [validationErrors, setValidationErrors] = useState({})

  const handleSubmit = async () => {
    setValidationErrors({})
    
    let validation
    if (isLogin) {
      validation = validateLoginForm(formData.email, formData.password)
    } else {
      validation = validateRegisterForm(formData.username, formData.email, formData.password, formData.confirmPassword)
    }

    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      const firstError = Object.values(validation.errors)[0]
      toast.error(firstError)
      return
    }

    setIsLoading(true)
    try {
      if (isLogin) {
        const res = await login(formData.email, formData.password)
        if (res.user && res.accessToken) {
          toast.success('Welcome back!')
          setTimeout(() => navigate('/dashboard'), 100)
        }
      } else {
        const res = await register(formData.username, formData.email, formData.password)
        if (res.user && res.accessToken) {
          toast.success('Account created!')
          setTimeout(() => navigate('/dashboard'), 100)
        }
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Authentication failed')
      if (err.response?.status === 401 || err.response?.status === 400) {
        toast.error('Invalid credentials')
      } else if (err.response?.status === 409) {
        toast.error('Email already registered')
      } else {
        toast.error(errorMsg)
      }
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const features = [
    {
      icon: Video,
      title: 'WebRTC P2P Video',
      desc: 'Crystal-clear peer-to-peer video with no servers in between. Low latency, high quality.',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800/40'
    },
    {
      icon: Code2,
      title: 'Collaborative Editor',
      desc: 'Yjs CRDT-powered real-time code collaboration. See changes as they happen, conflict-free.',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-100 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-800/40'
    },
    {
      icon: Brain,
      title: 'AI Hints with Gemini',
      desc: 'Stuck? Get intelligent hints powered by Google Gemini without spoiling the solution.',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-800/40'
    },
    {
      icon: BarChart3,
      title: 'Session Replay & Analytics',
      desc: 'Watch your session back, track your ELO growth, and get detailed AI-generated debriefs.',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-800/40'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-sky-900/30 border border-sky-800/50 rounded-full px-4 py-1.5 mb-6">
                <span className="text-sky-300 text-sm font-medium">⚡ Collaborative Coding & Interview Practice</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-gray-100 leading-tight mb-6">
                Solve Problems &{' '}
                <span className="gradient-underline">Ace Interviews</span>{' '}
                with Real-Time Collaboration
              </h1>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Practice algorithms solo using our built-in editor, or pair up with a partner 
                for a mock interview with live coding, video chat, and AI-powered feedback.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/find-partner"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Practice with a Partner
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/problems"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                >
                  Solve Problems Solo
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-6 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Join 1,200+ developers practicing daily
              </p>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {!user ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl">
                  <div className="flex gap-1 mb-6 bg-gray-800 p-1 rounded-xl">
                    {[
                      { key: true, label: 'Sign In' },
                      { key: false, label: 'Register' }
                    ].map(({ key, label }) => (
                      <button
                        key={label}
                        onClick={() => setIsLogin(key)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isLogin === key ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        const redirectUri = `${window.location.origin}/auth/callback`;
                        const scope = 'openid email profile';
                        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
                        window.location.href = authUrl;
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 shadow-sm transition-all disabled:opacity-50"
                    >
                      <svg viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.97-6.17z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-500">Or continue with email</span>
                      </div>
                    </div>
                    {!isLogin && (
                      <div>
                        <label className="label">Username</label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                          placeholder="johndoe"
                          className={`input-field ${validationErrors.username ? 'border-red-500' : ''}`}
                          aria-label="Username"
                          aria-describedby={validationErrors.username ? 'username-error' : undefined}
                        />
                        {validationErrors.username && (
                          <p id="username-error" className="text-xs text-red-400 mt-1">{validationErrors.username}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData?.getData('text/plain')
                          if (pastedText) {
                            setFormData(p => ({ ...p, email: pastedText.trim() }))
                          }
                        }}
                        placeholder="you@example.com"
                        className={`input-field ${validationErrors.email ? 'border-red-500' : ''}`}
                        aria-label="Email"
                        aria-describedby={validationErrors.email ? 'email-error' : undefined}
                      />
                      {validationErrors.email && (
                        <p id="email-error" className="text-xs text-red-400 mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="label">Password</label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={formData.password}
                          onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                          onPaste={(e) => {
                            const pastedText = e.clipboardData?.getData('text/plain')
                            if (pastedText) {
                              setFormData(p => ({ ...p, password: pastedText }))
                            }
                          }}
                          placeholder="••••••••"
                          className={`input-field pr-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                          aria-label="Password"
                          aria-describedby={validationErrors.password ? 'password-error' : undefined}
                        />
                        <button
                          onClick={() => setShowPass(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                          aria-label={showPass ? 'Hide password' : 'Show password'}
                          type="button"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {validationErrors.password && (
                        <p id="password-error" className="text-xs text-red-400 mt-1">{validationErrors.password}</p>
                      )}
                    </div>
                    {!isLogin && (
                      <div>
                        <label className="label">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                            onPaste={(e) => {
                              const pastedText = e.clipboardData?.getData('text/plain')
                              if (pastedText) {
                                setFormData(p => ({ ...p, confirmPassword: pastedText }))
                              }
                            }}
                            placeholder="••••••••"
                            className={`input-field pr-10 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                            aria-label="Confirm password"
                            aria-describedby={validationErrors.confirmPassword ? 'confirm-password-error' : undefined}
                          />
                        <button
                          onClick={() => setShowConfirmPass(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                            aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                            type="button"
                          >
                            {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {validationErrors.confirmPassword && (
                          <p id="confirm-password-error" className="text-xs text-red-400 mt-1">{validationErrors.confirmPassword}</p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label={isLogin ? 'Sign in to your account' : 'Create a new account'}
                    >
                      {isLoading ? <Spinner size="sm" /> : null}
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <HeroIllustration />
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mt-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Welcome back, <span className="text-indigo-400 font-semibold">{user.username}</span>!</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/dashboard" className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                        Dashboard
                      </Link>
                      <Link to="/problems" className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 transition-colors">
                        Problems
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Find a Partner Right Now</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">Get instantly matched with another developer for a practice session</p>
          </div>
          <MatchingQueue />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Practice coding & ace your interviews</h2>
          <p className="text-gray-600 dark:text-gray-400">Solve problems solo or with a partner — real-time collaboration, AI feedback, and structured learning tracks</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
