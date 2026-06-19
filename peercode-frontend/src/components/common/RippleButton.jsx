import { useCallback } from 'react'

export default function RippleButton({ children, className = '', onClick, ...props }) {
  const handleClick = useCallback((e) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const circle = document.createElement('span')
    circle.className = 'ripple-circle'
    circle.style.width = circle.style.height = `${size}px`
    circle.style.left = `${e.clientX - rect.left - size / 2}px`
    circle.style.top = `${e.clientY - rect.top - size / 2}px`
    btn.appendChild(circle)
    setTimeout(() => circle.remove(), 600)
    onClick?.(e)
  }, [onClick])

  return (
    <button className={`ripple-btn ${className}`} onClick={handleClick} {...props}>
      {children}
    </button>
  )
}
