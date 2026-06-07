import { createContext, useContext, useState, useEffect } from 'react'
import { setGeminiKey as setApiGeminiKey } from '../services/api'

const STORAGE_KEY = 'peercode_gemini_key'

const GeminiContext = createContext(null)

export function GeminiProvider({ children }) {
  const [userApiKey, setUserApiKeyState] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setUserApiKeyState(stored)
      setApiGeminiKey(stored)
    }
  }, [])

  const setUserApiKey = (key) => {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key)
      setApiGeminiKey(key)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      setApiGeminiKey(null)
    }
    setUserApiKeyState(key || null)
  }

  return (
    <GeminiContext.Provider value={{ userApiKey, setUserApiKey, hasPersonalKey: !!userApiKey }}>
      {children}
    </GeminiContext.Provider>
  )
}

export function useGeminiContext() {
  const ctx = useContext(GeminiContext)
  if (!ctx) throw new Error('useGeminiContext must be used within GeminiProvider')
  return ctx
}

export default GeminiContext
