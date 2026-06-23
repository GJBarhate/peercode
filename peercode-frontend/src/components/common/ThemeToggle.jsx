import { useRef, useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Sun, Moon, Sunrise, Waves } from 'lucide-react'

export const THEME_CONFIG = [
  { key: 'light', icon: Sun, label: 'Light', gradient: 'from-sky-400 to-blue-500', glow: 'rgba(56, 189, 248, 0.4)' },
  { key: 'dawn', icon: Sunrise, label: 'Dawn', gradient: 'from-amber-400 to-orange-500', glow: 'rgba(251, 191, 36, 0.4)' },
  { key: 'dark', icon: Moon, label: 'Dark', gradient: 'from-indigo-400 to-violet-500', glow: 'rgba(129, 140, 248, 0.4)' },
  { key: 'emerald', icon: Waves, label: 'Emerald', gradient: 'from-emerald-400 to-teal-500', glow: 'rgba(52, 211, 153, 0.4)' },
]

export default function ThemeToggle({ showLabels = true, vertical = false }) {
  const { theme, setTheme } = useTheme()
  const containerRef = useRef(null)
  const [pillStyle, setPillStyle] = useState({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!containerRef.current || !mounted) return
    const activeIdx = THEME_CONFIG.findIndex(t => t.key === theme)
    const buttons = containerRef.current.querySelectorAll('[data-theme-btn]')
    if (buttons[activeIdx]) {
      const btn = buttons[activeIdx]
      const container = containerRef.current
      if (vertical) {
        setPillStyle({ top: btn.offsetTop - container.offsetTop, height: btn.offsetHeight })
      } else {
        setPillStyle({ left: btn.offsetLeft - container.offsetLeft, width: btn.offsetWidth })
      }
    }
  }, [theme, mounted, vertical, showLabels])

  const activeConfig = THEME_CONFIG.find(t => t.key === theme)

  return (
    <div className="relative" role="radiogroup" aria-label="Theme selection">
      <div
        ref={containerRef}
        className={`relative p-1 rounded-xl bg-bg-elevated border border-border-subtle ${vertical ? 'flex flex-col gap-0.5' : 'flex items-center gap-0.5'}`}
        style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
      >
        {/* Sliding pill indicator */}
        {mounted && (
          <div
            className={`absolute rounded-lg bg-gradient-to-r ${activeConfig?.gradient} transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${vertical ? 'left-1 right-1' : 'top-1 h-[calc(100%-8px)]'}`}
            style={vertical
              ? { top: pillStyle.top, height: pillStyle.height, boxShadow: `0 2px 8px ${activeConfig?.glow}, inset 0 1px 0 rgba(255,255,255,0.2)` }
              : { left: pillStyle.left, width: pillStyle.width, boxShadow: `0 2px 8px ${activeConfig?.glow}, inset 0 1px 0 rgba(255,255,255,0.2)` }
            }
          />
        )}

        {THEME_CONFIG.map(({ key, icon: Icon, label }) => {
          const isActive = theme === key
          return (
            <button
              key={key}
              data-theme-btn
              role="radio"
              aria-checked={isActive}
              aria-label={`${label} theme`}
              title={label}
              onClick={() => setTheme(key)}
              className={`
                relative z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200
                ${vertical ? 'justify-center' : ''}
                ${isActive
                  ? 'text-white'
                  : 'text-text-muted hover:text-text-primary'
                }
              `}
            >
              <Icon className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
              {showLabels && <span>{label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
