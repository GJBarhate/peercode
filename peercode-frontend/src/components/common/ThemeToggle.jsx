import { useTheme } from '../../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="relative w-[52px] h-[26px] rounded-full transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Track icons */}
      <span className="absolute left-[7px] top-1/2 -translate-y-1/2 transition-opacity duration-300" style={{ opacity: isDark ? 0.4 : 1 }}>
        <Sun className="w-[11px] h-[11px] text-amber-500" />
      </span>
      <span className="absolute right-[7px] top-1/2 -translate-y-1/2 transition-opacity duration-300" style={{ opacity: isDark ? 1 : 0.4 }}>
        <Moon className="w-[11px] h-[11px] text-indigo-400" />
      </span>

      {/* Sliding knob */}
      <span
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center shadow-sm"
        style={{
          left: isDark ? 'calc(100% - 21px)' : '3px',
          background: isDark ? '#6366f1' : '#ffffff',
          boxShadow: isDark
            ? '0 1px 3px rgba(0,0,0,0.2)'
            : '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {isDark ? (
          <Moon className="w-[10px] h-[10px] text-white" />
        ) : (
          <Sun className="w-[10px] h-[10px] text-amber-500" />
        )}
      </span>
    </button>
  )
}
