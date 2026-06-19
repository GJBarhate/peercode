import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { API_BASE_URL, setAccessToken as setApiToken } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const { setAccessToken, setUser } = useAuth()

  useEffect(() => {
    let cancelled = false

    async function handleCallback() {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

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
  }, [searchParams, setAccessToken, setUser, navigate])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Helmet>
          <title>Signing in... | PeerCode</title>
        </Helmet>
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 dark:text-indigo-400 animate-spin mx-auto" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Completing sign in with Google...</p>
          <p className="text-gray-500 text-sm">Please wait while we verify your account.</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sign In Failed</h2>
          <p className="text-gray-600 dark:text-gray-400">{error || 'An unexpected error occurred.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/', { replace: true })}
              className="flex-1 px-4 py-3 rounded-xl font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Success!</h2>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}