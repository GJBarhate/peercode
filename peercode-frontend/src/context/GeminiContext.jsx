import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
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

 const setUserApiKey = useCallback((key) => {
 if (key) {
 localStorage.setItem(STORAGE_KEY, key)
 setApiGeminiKey(key)
 } else {
 localStorage.removeItem(STORAGE_KEY)
 setApiGeminiKey(null)
 }
 setUserApiKeyState(key || null)
 }, [])

 const value = useMemo(
 () => ({ userApiKey, setUserApiKey, hasPersonalKey: !!userApiKey }),
 [userApiKey, setUserApiKey]
 )

 return (
 <GeminiContext.Provider value={value}>
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
