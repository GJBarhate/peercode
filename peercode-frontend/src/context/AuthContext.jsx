import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_BASE_URL, setAccessToken as setApiToken, setTokenRefreshHandler } from '../services/api'
import { logger } from '../utils/logger'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessTokenState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token)
    setApiToken(token)
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

  const refreshToken = useCallback(async () => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      setAccessToken(data.accessToken)
      setUser(data.user)
      return data.accessToken
    } catch (_) {
      setUser(null)
      setAccessToken(null)
      return null
    }
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
        // Check if we have a stored access token from sessionStorage
        const storedToken = (() => { try { return sessionStorage.getItem('peercode_access_token'); } catch(_) { return null; } })();
        
        if (storedToken) {
          // Token exists — set it and try a lightweight verify instead of full refresh
          setAccessToken(storedToken)
          
          // Try to use the stored token immediately, refresh in background
          try {
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              {
                withCredentials: true,
                timeout: 3000
              }
            )
            if (mounted) {
              setAccessToken(response.data.accessToken)
              setUser(response.data.user)
            }
          } catch (_) {
            // Refresh failed — token might still be valid for a while
            // User will get 401 on next API call and interceptor will refresh
            if (mounted) {
              // Don't clear user — token might still work
              // Only clear if we got a 401
              if (_.response?.status === 401) {
                setUser(null)
                setAccessToken(null)
              }
            }
          }
        } else {
          // No stored token — try to refresh using cookie
          try {
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              {
                withCredentials: true,
                timeout: 5000
              }
            )
            if (mounted) {
              setAccessToken(response.data.accessToken)
              setUser(response.data.user)
            }
          } catch (refreshErr) {
            logger.warn('Token refresh failed during init:', refreshErr.message)
            if (mounted) {
              setUser(null)
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

  return (
    <AuthContext.Provider value={{ user, setUser, accessToken, setAccessToken, isLoading, login, register, logout, refreshToken, verifyOTP, resendOTP }}>
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
