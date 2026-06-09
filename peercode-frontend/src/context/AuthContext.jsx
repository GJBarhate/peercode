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
        // Try to refresh using httpOnly cookie to get a new access token
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            {
              withCredentials: true,
              timeout: 5000 // 5 second timeout to prevent hanging
            }
          )
          if (mounted) {
            setAccessToken(response.data.accessToken)
            setUser(response.data.user)
          }
        } catch (refreshErr) {
          logger.warn('Token refresh failed during init:', refreshErr.message)
          // If refresh fails, user is not authenticated
          if (mounted) {
            setUser(null)
          }
        }
      } catch (err) {
        logger.error('Auth init error:', err)
      } finally {
        // CRITICAL: Only set loading to false after refresh attempt completes
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
      
      // Now perform registration
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/register`,
        { username, email, password },
        { withCredentials: true }
      )
      setAccessToken(data.accessToken)
      setUser(data.user)
      return data
    } catch (error) {
      logger.error('Registration failed:', error)
      throw error
    }
  }, [setAccessToken, clearAllSessions])

  return (
    <AuthContext.Provider value={{ user, setUser, accessToken, setAccessToken, isLoading, login, register, logout, refreshToken }}>
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
