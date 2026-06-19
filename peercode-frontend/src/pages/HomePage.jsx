import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { TypeAnimation } from 'react-type-animation'
import { Code2, Video, Users, Brain, BarChart3, ArrowRight, X, Eye, EyeOff, Chrome, CheckCircle2, Star, Zap, Bot } from 'lucide-react'
import { io as socketIO } from 'socket.io-client'
import MatchingQueue from '../components/room/MatchingQueue'
import Spinner from '../components/common/Spinner'
import HeroIllustration from '../components/common/HeroIllustration'
import Footer from '../components/common/Footer'
import ParticlesBackground from '../components/common/ParticlesBackground'
import TiltCard from '../components/common/TiltCard'
import MagneticButton from '../components/common/MagneticButton'
import LiveStatsBar from '../components/home/LiveStatsBar'
import ProblemOfTheDay from '../components/home/ProblemOfTheDay'
import { useAuth } from '../context/AuthContext'
import { validateLoginForm, validateRegisterForm, validatePassword } from '../utils/validation'
import { getErrorMessage, googleAuth, API_BASE_URL } from '../services/api'
import toast from 'react-hot-toast'

export default function HomePage() {
  const { user, login, register, verifyOTP, resendOTP } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const showRegister = searchParams.get('register') === '1'
  const [isLogin, setIsLogin] = useState(!showRegister)
  const [isLoading, setIsLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [validationErrors, setValidationErrors] = useState({})
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')

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
      const firstError = Object.values(validation.errors || {})[0]
      toast.error(firstError)
      return
    }

    setIsLoading(true)
    try {
      if (isLogin) {
        const res = await login(formData.email, formData.password)
        if (res.user && res.accessToken) {
          toast.success('Welcome back!')
          navigate('/dashboard', { replace: true })
          return
        }
      } else {
        const res = await register(formData.username, formData.email, formData.password)
        if (res.requiresVerification) {
          setShowOTP(true)
          setRegisteredEmail(formData.email)
          toast.success('Registration successful! Check your email for the verification code.')
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    try {
      const res = await verifyOTP(registeredEmail, otp)
      if (res.user && res.accessToken) {
        toast.success('Email verified! Welcome to PeerCode!')
        navigate('/dashboard', { replace: true })
        return
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Verification failed')
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    try {
      await resendOTP(registeredEmail)
      toast.success('New OTP sent to your email!')
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Failed to resend OTP')
      toast.error(errorMsg)
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
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'hover:shadow-blue-500/10'
    },
    {
      icon: Code2,
      title: 'Collaborative Editor',
      desc: 'Yjs CRDT-powered real-time code collaboration. See changes as they happen, conflict-free.',
      gradient: 'from-indigo-500 to-violet-500',
      glow: 'hover:shadow-indigo-500/10'
    },
    {
      icon: Brain,
      title: 'AI Hints with Gemini',
      desc: 'Stuck? Get intelligent hints powered by Google Gemini without spoiling the solution.',
      gradient: 'from-purple-500 to-pink-500',
      glow: 'hover:shadow-purple-500/10'
    },
    {
      icon: BarChart3,
      title: 'Session Replay & Analytics',
      desc: 'Watch your session back, track your ELO growth, and get detailed AI-generated debriefs.',
      gradient: 'from-emerald-500 to-teal-500',
      glow: 'hover:shadow-emerald-500/10'
    }
  ]

  const steps = [
    {
      number: '1',
      icon: CheckCircle2,
      title: 'Create Account',
      desc: 'Sign up in seconds with email or Google'
    },
    {
      number: '2',
      icon: Zap,
      title: 'Choose Your Mode',
      desc: 'Solo practice, Partner session, or AI Interview'
    },
    {
      number: '3',
      icon: Bot,
      title: 'Practice & Get Feedback',
      desc: 'Solve problems and receive AI-powered debriefs'
    }
  ]

  const testimonials = [
    {
      quote: 'Helped me land an offer at Google. The mock interview experience is incredibly realistic.',
      handle: '@dev_rahul',
      role: 'Software Engineer',
      stars: 5
    },
    {
      quote: 'The AI debrief feedback is incredibly detailed. I improved my time complexity explanations massively.',
      handle: '@alice_codes',
      role: 'CS Graduate',
      stars: 5
    },
    {
      quote: 'Best way to practice with a friend. The collab editor is buttery smooth.',
      handle: '@siddharth_42',
      role: 'SDE-2 at Amazon',
      stars: 5
    }
  ]

  const [liveStats, setLiveStats] = useState(null)
  useEffect(() => {
    const socketUrl = (API_BASE_URL || '').replace(/\/api\/?$/, '')
    const statsSocket = socketIO(`${socketUrl}/stats`, { transports: ['websocket', 'polling'] })
    statsSocket.on('stats-update', (data) => setLiveStats(data))
    return () => statsSocket.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Helmet>
        <title>PeerCode — Collaborative Coding & Interview Practice</title>
        <meta name="description" content="Practice algorithms solo or with a partner. Real-time collaborative coding, WebRTC video, AI-powered feedback, and session replay." />
        <meta property="og:title" content="PeerCode — Ace Your Coding Interviews" />
        <meta property="og:description" content="Solve problems, pair program, and get AI-powered debriefs. Join 1,200+ developers practicing daily." />
        <meta property="og:type" content="website" />
      </Helmet>
      <style>{`
        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-50px, 30px) scale(1.08); }
          70% { transform: translate(30px, -20px) scale(0.95); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .orb-1 { animation: orb-float-1 12s ease-in-out infinite; }
        .orb-2 { animation: orb-float-2 16s ease-in-out infinite; }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
      `}</style>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 aurora-bg pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-gray-950/80 to-gray-950 pointer-events-none" />
        <ParticlesBackground count={60} />
        <div className="orb-1 absolute top-10 left-1/4 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-2 absolute top-32 right-1/4 w-[380px] h-[380px] bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[200px] bg-violet-700/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2.5 glass-card rounded-full px-4 py-1.5 mb-7">
                <span className="pulse-dot w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-indigo-300 text-sm font-medium tracking-wide">Collaborative Coding & Interview Practice</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-gray-100 leading-tight mb-6">
                <TypeAnimation
                  sequence={[
                    'Solve Problems',
                    2000,
                    'Ace Interviews',
                    2000,
                    'Practice Together',
                    2000,
                    'Level Up Skills',
                    2000,
                  ]}
                  wrapper="span"
                  speed={40}
                  repeat={Infinity}
                  className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
                />{' '}
                <br />with Real-Time Collaboration
              </h1>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-xl">
                Practice algorithms solo using our built-in editor, or pair up with a partner
                for a mock interview with live coding, video chat, and AI-powered feedback.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/find-partner"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-all duration-300 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 hover:-translate-y-0.5"
                >
                  <Users className="w-4 h-4" />
                  Practice with a Partner
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/problems"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-200 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] hover:border-white/[0.18] transition-all duration-300 hover:-translate-y-0.5"
                >
                  Solve Problems Solo
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Join 1,200+ developers practicing daily
              </p>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {!user ? (
                <div className="bg-gray-900/80 border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/40 backdrop-blur-md">
                  <div className="flex gap-1 mb-6 bg-white/[0.04] p-1 rounded-xl">
                    {[
                      { key: true, label: 'Sign In' },
                      { key: false, label: 'Register' }
                    ].map(({ key, label }) => (
                      <button
                        key={label}
                        onClick={() => { setIsLogin(key); setValidationErrors({}) }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          isLogin === key ? 'bg-white/[0.1] text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
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
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] hover:border-white/[0.18] text-gray-200 transition-all duration-300 disabled:opacity-50"
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
                        <div className="w-full border-t border-white/[0.08]" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-900 text-gray-500">Or continue with email</span>
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-all duration-300"
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-all duration-300"
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
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
                      aria-label={isLogin ? 'Sign in to your account' : 'Create a new account'}
                    >
                      {isLoading ? <Spinner size="sm" /> : null}
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                    {showOTP && (
                      <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                        <div>
                          <label className="label">Verification Code</label>
                          <input
                            type="text"
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="input-field text-center text-lg tracking-widest font-mono"
                            onKeyDown={e => { if (e.key === 'Enter') handleVerifyOTP() }}
                          />
                          <p className="text-xs text-gray-500 mt-1">Check your email for the verification code</p>
                        </div>
                        <button
                          onClick={handleVerifyOTP}
                          disabled={isLoading || otp.length !== 6}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                          {isLoading ? <Spinner size="sm" /> : null}
                          Verify & Login
                        </button>
                        <button
                          onClick={handleResendOTP}
                          disabled={isLoading}
                          className="w-full text-sm text-indigo-400 hover:text-indigo-300 transition-all duration-300"
                        >
                          Didn't receive code? Resend OTP
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <HeroIllustration />
                  <div className="bg-gray-900/80 border border-white/[0.08] rounded-2xl p-4 mt-4 backdrop-blur-md">
                    <p className="text-gray-400 text-sm mb-3">Welcome back, <span className="text-indigo-400 font-semibold">{user.username}</span>!</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/dashboard" className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-300">
                        Dashboard
                      </Link>
                      <Link to="/problems" className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.05] hover:bg-white/[0.09] text-gray-200 border border-white/[0.1] hover:border-white/[0.18] transition-all duration-300">
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

      <div className="border-y border-white/[0.06] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LiveStatsBar stats={liveStats} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-shimmer mb-3">How It Works</h2>
          <p className="text-gray-500 max-w-md mx-auto">Three steps to sharpen your skills and land your next role</p>
        </div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-center gap-0 md:gap-0">
          {steps.map(({ number, icon: Icon, title, desc }, idx) => (
            <div key={title} className="flex flex-col md:flex-row items-center flex-1">
              <div className="flex flex-col items-center text-center px-6 max-w-xs mx-auto">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center backdrop-blur-sm">
                    <Icon className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                    {number}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-100 mb-1.5 text-lg">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden md:flex flex-1 items-center justify-center min-w-[40px]">
                  <div className="w-full border-t-2 border-dashed border-white/[0.1]" />
                </div>
              )}
              {idx < steps.length - 1 && (
                <div className="flex md:hidden items-center justify-center my-4">
                  <div className="h-10 border-l-2 border-dashed border-white/[0.1]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gray-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-gray-100">Find a Partner Right Now</h2>
            </div>
            <p className="text-gray-500 text-sm mt-1">Get instantly matched with another developer for a practice session</p>
          </div>
          <MatchingQueue />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <ProblemOfTheDay />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-shimmer mb-3">Everything you need to excel</h2>
          <p className="text-gray-500">Solve problems solo or with a partner — real-time collaboration, AI feedback, and structured learning tracks</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-reveal">
          {features.map(({ icon: Icon, title, desc, gradient, glow }) => (
            <TiltCard
              key={title}
              className={`glass-card glass-card-hover gradient-border rounded-2xl p-6 hover:-translate-y-1 cursor-default`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${gradient} shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-200 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </TiltCard>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-100 mb-3">Loved by developers</h2>
          <p className="text-gray-500">Join thousands who've already leveled up their interview game</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 stagger-reveal">
          {testimonials.map(({ quote, handle, role, stars }) => (
            <TiltCard
              key={handle}
              intensity={6}
              className="glass-card glass-card-hover gradient-border rounded-2xl p-6 hover:-translate-y-1"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-5">"{quote}"</p>
              <div className="flex flex-col gap-0.5">
                <span className="text-indigo-400 font-semibold text-sm">{handle}</span>
                <span className="text-gray-500 text-xs">{role}</span>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
