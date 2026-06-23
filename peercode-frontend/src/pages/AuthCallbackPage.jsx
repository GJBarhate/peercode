import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL, setAccessToken as setApiToken } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

let codeConsumed = false

export default function AuthCallbackPage() {
 const navigate = useNavigate()
 const [status, setStatus] = useState('loading')
 const [error, setError] = useState(null)
 const { setAccessToken, setUser } = useAuth()
 const processedRef = useRef(false)

 useEffect(() => {
 if (processedRef.current || codeConsumed) return
 processedRef.current = true
 codeConsumed = true

 let cancelled = false

 async function handleCallback() {
 const params = new URLSearchParams(window.location.search)
 const code = params.get('code')
 const errorParam = params.get('error')

 if (errorParam) {
 const msg = errorParam === 'access_denied' ? 'You denied the permission request.' : 'Authentication failed.'
 if (!cancelled) { setStatus('error'); setError(msg) }
 toast.error(msg)
 return
 }

 if (!code) {
 const msg = 'No authorization code received.'
 if (!cancelled) { setStatus('error'); setError(msg) }
 toast.error(msg)
 return
 }

 try {
 const { data } = await axios.post(
 `${API_BASE_URL}/auth/google`,
 { code },
 { withCredentials: true }
 )
 if (!cancelled) {
 setAccessToken(data.accessToken)
 setUser(data.user)
 setApiToken(data.accessToken)
 setStatus('success')
 }
 toast.success('Welcome to PeerCode!')
 navigate('/dashboard', { replace: true })
 } catch (err) {
 const errorMsg = err.response?.data?.message || err.message || 'Google authentication failed'
 if (!cancelled) { setStatus('error'); setError(errorMsg) }
 toast.error(errorMsg)
 }
 }

 handleCallback()

 return () => { cancelled = true }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [])

 if (status === 'loading') {
 return (
 <div className="min-h-screen bg-bg-base flex items-center justify-center">
 <Helmet>
 <title>Signing in... | PeerCode</title>
 </Helmet>
 <div className="text-center space-y-4">
 <Loader2 className="w-12 h-12 text-indigo-500 dark:text-indigo-400 animate-spin mx-auto" />
 <p className="text-text-muted text-lg">Completing sign in with Google...</p>
 <p className="text-text-muted text-sm">Please wait while we verify your account.</p>
 </div>
 </div>
 )
 }

 if (status === 'error') {
 return (
 <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
 <div className="bg-bg-surface border border-border-default rounded-2xl p-8 max-w-md w-full text-center space-y-4">
 <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto" />
 <h2 className="text-2xl font-bold text-text-primary">Sign In Failed</h2>
 <p className="text-text-muted">{error || 'An unexpected error occurred.'}</p>
 <div className="flex gap-3 justify-center">
 <button
 onClick={() => navigate('/', { replace: true })}
 className="flex-1 px-4 py-3 rounded-xl font-semibold bg-bg-elevated hover:bg-bg-overlay text-text-secondary transition-colors"
 >
 Back to Home
 </button>
 <button
 onClick={() => navigate('/', { replace: true })}
 className="flex-1 px-4 py-3 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
 >
 Try Again
 </button>
 </div>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-bg-base flex items-center justify-center">
 <div className="text-center space-y-4">
 <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
 <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
 </div>
 <h2 className="text-2xl font-bold text-text-primary">Success!</h2>
 <p className="text-text-muted">Redirecting to dashboard...</p>
 </div>
 </div>
 )
}