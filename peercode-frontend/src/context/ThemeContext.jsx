import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'peercode_theme'
const THEMES = ['light', 'dark', 'dawn', 'emerald']

export function ThemeProvider({ children }) {
 const [theme, setTheme] = useState(() => {
 if (typeof window !== 'undefined') {
 const stored = localStorage.getItem(STORAGE_KEY)
 if (stored && THEMES.includes(stored)) return stored
 return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
 }
 return 'dark'
 })

 useEffect(() => {
 const root = document.documentElement
 root.classList.remove('dark', 'dawn', 'emerald')

 switch (theme) {
 case 'dark':
 root.classList.add('dark')
 break
 case 'dawn':
 root.classList.add('dawn')
 break
 case 'emerald':
 root.classList.add('dark', 'emerald')
 break
 }

 root.setAttribute('data-theme', theme)
 localStorage.setItem(STORAGE_KEY, theme)
 }, [theme])

 const cycleTheme = useCallback(() => {
 setTheme(prev => {
 const idx = THEMES.indexOf(prev)
 return THEMES[(idx + 1) % THEMES.length]
 })
 }, [])

 const isDark = theme === 'dark' || theme === 'emerald'

 const value = useMemo(
 () => ({ theme, setTheme, cycleTheme, isDark, themes: THEMES }),
 [theme, cycleTheme, isDark]
 )

 return (
 <ThemeContext.Provider value={value}>
 {children}
 </ThemeContext.Provider>
 )
}

export function useTheme() {
 const ctx = useContext(ThemeContext)
 if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
 return ctx
}

export default ThemeContext
