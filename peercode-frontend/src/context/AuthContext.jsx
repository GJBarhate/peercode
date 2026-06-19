import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { API_BASE_URL, setAccessToken as setApiToken, setTokenRefreshHandler, refreshAccessToken } from '../services/api'
import { logger } from '../utils/logger'

const AuthContext = createContext(null)

function parseJwtExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch { return null }
}

function isTokenExpired(token) {
  const exp = parseJwtExp(token)
  if (!exp) return true
  return Date.now() >= exp
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessTokenState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showExpiryWarning, setShowExpiryWarning] = useState(false)
  const expiryTimerRef = useRef(null)

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token)
    setApiToken(token)
    // Schedule session expiry warning at T-5min
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
    if (token) {
      const exp = parseJwtExp(token)
      if (exp) {
        const warnAt = exp - Date.now() - 5 * 60 * 1000
        if (warnAt > 0) {
          expiryTimerRef.current = setTimeout(() => setShowExpiryWarning(true), warnAt)
        }
      }
    }
  }, [])

  const clearAllSessions = useCallback(() => {
    // Clear only PeerCode-specific localStorage items
    localStorage.removeItem('peercode_gemini_key')

    // Clear all cookies
    document.cookie.split(';').forEach(c => {
      const cookieName = c.split('=')[0].trim()
      if (cookieName) {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname}`
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
      }
    })

    // Clear session storage
    sessionStorage.clear()
  }, [])

  const logout = useCallback(async (navigate) => {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      )
    } catch (_) {}

    // Clear all sessions before redirecting
    clearAllSessions()
    setUser(null)
    setAccessToken(null)

    // Use React Router navigation if provided, otherwise fallback to window.location
    if (navigate) {
      navigate('/')
    } else {
      window.location.href = '/'
    }
  }, [setAccessToken, clearAllSessions])

  const refreshPromiseRef = useRef(null)

  const refreshToken = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current

    const promise = (async () => {
      try {
        const token = await refreshAccessToken()
        if (!token) throw new Error('Refresh failed')
        return token
      } catch (_) {
        setUser(null)
        setAccessToken(null)
        return null
      }
    })()

    refreshPromiseRef.current = promise
    const result = await promise
    refreshPromiseRef.current = null
    return result
  }, [setAccessToken])

  useEffect(() => {
    let mounted = true

    setTokenRefreshHandler((token, refreshedUser) => {
      if (!mounted) return
      setAccessToken(token)
      if (refreshedUser) {
        setUser(refreshedUser)
      }
    })

    async function init() {
      try {
        const storedToken = (() => { try { return sessionStorage.getItem('peercode_access_token'); } catch(_) { return null; } })();

        if (storedToken && !isTokenExpired(storedToken)) {
          setAccessToken(storedToken)

          try {
            const { data } = await axios.get(
              `${API_BASE_URL}/users/profile`,
              {
                headers: { Authorization: `Bearer ${storedToken}` },
                withCredentials: true,
                timeout: 5000,
              }
            )
            if (mounted) {
              const userData = data?.data || data?.user || data
              setUser(userData)
            }
          } catch (profileErr) {
            if (mounted && profileErr.response?.status === 401) {
              setUser(null)
              setAccessToken(null)
            }
          }
        } else {
          try {
            const token = await refreshAccessToken()
            if (mounted && token) {
              const { data } = await axios.get(
                `${API_BASE_URL}/users/profile`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  withCredentials: true,
                  timeout: 5000,
                }
              )
              if (mounted) {
                setAccessToken(token)
                const userData = data?.data || data?.user || data
                setUser(userData)
              }
            } else if (mounted) {
              setUser(null)
              setAccessToken(null)
            }
          } catch (refreshErr) {
            logger.warn('Token refresh failed during init:', refreshErr.message)
            if (mounted) {
              setUser(null)
              setAccessToken(null)
            }
          }
        }
      } catch (err) {
        logger.error('Auth init error:', err)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    init()
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false
      setTokenRefreshHandler(null)
    }
  }, [setAccessToken])

  const login = useCallback(async (email, password) => {
    try {
      // Clear any previous sessions first
      clearAllSessions()
      setUser(null)
      setAccessTokenState(null)
      setApiToken(null)
      
      // Now perform login
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      )
      setAccessToken(data.accessToken)
      setUser(data.user)
      return data
    } catch (error) {
      logger.error('Login failed:', error)
      throw error
    }
  }, [setAccessToken, clearAllSessions])

  const register = useCallback(async (username, email, password) => {
    try {
      // Clear any previous sessions first
      clearAllSessions()
      setUser(null)
      setAccessTokenState(null)
      setApiToken(null)
      
      // Now perform registration - returns message, NOT tokens
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/register`,
        { username, email, password },
        { withCredentials: true }
      )
      return data
    } catch (error) {
      logger.error('Registration failed:', error)
      throw error
    }
  }, [clearAllSessions])

  const verifyOTP = useCallback(async (email, otp) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/verify-otp`,
        { email, otp },
        { withCredentials: true }
      )
      setAccessToken(data.accessToken)
      setUser(data.user)
      return data
    } catch (error) {
      logger.error('OTP verification failed:', error)
      throw error
    }
  }, [setAccessToken])

  const resendOTP = useCallback(async (email) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/resend-otp`,
        { email },
        { withCredentials: true }
      )
      return data
    } catch (error) {
      logger.error('Resend OTP failed:', error)
      throw error
    }
  }, [])

  const renewSession = useCallback(async () => {
    setShowExpiryWarning(false)
    await refreshToken()
  }, [refreshToken])

  const dismissExpiryAndLogout = useCallback(async () => {
    setShowExpiryWarning(false)
    await logout()
  }, [logout])

  return (
    <AuthContext.Provider value={{ user, setUser, accessToken, setAccessToken, isLoading, login, register, logout, refreshToken, verifyOTP, resendOTP, showExpiryWarning, renewSession, dismissExpiryAndLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
