import { useRef, useCallback } from 'react'

export default function GlowCard({ children, className = '', ...props }) {
  const ref = useRef(null)

  const handleMouse = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--glow-x', `${e.clientX - rect.left - 150}px`)
    el.style.setProperty('--glow-y', `${e.clientY - rect.top - 150}px`)
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      className={`glow-card glass-card glass-card-hover rounded-2xl transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
