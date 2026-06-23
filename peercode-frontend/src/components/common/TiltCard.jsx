import { useRef, useCallback } from 'react'

export default function TiltCard({ children, className = '', intensity = 8, ...props }) {
 const ref = useRef(null)

 const handleMove = useCallback((e) => {
 const el = ref.current
 if (!el) return
 const rect = el.getBoundingClientRect()
 const x = (e.clientX - rect.left) / rect.width - 0.5
 const y = (e.clientY - rect.top) / rect.height - 0.5
 el.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale3d(1.02, 1.02, 1.02)`
 }, [intensity])

 const handleLeave = useCallback(() => {
 const el = ref.current
 if (!el) return
 el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)'
 }, [])

 return (
 <div
 ref={ref}
 onMouseMove={handleMove}
 onMouseLeave={handleLeave}
 className={`tilt-card ${className}`}
 {...props}
 >
 {children}
 </div>
 )
}
