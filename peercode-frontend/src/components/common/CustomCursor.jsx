import { useEffect, useRef } from 'react'

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select'

export default function CustomCursor() {
 const dotRef = useRef(null)

 useEffect(() => {
 const dot = dotRef.current
 if (!dot) return
 if (window.matchMedia('(pointer: coarse)').matches) return

 const move = (e) => {
 dot.style.left = `${e.clientX}px`
 dot.style.top = `${e.clientY}px`
 }

 // Use event delegation instead of per-element listeners to avoid memory leaks
 const handleOver = (e) => {
 if (e.target.closest(INTERACTIVE_SELECTOR)) dot.classList.add('active')
 }
 const handleOut = (e) => {
 if (e.target.closest(INTERACTIVE_SELECTOR)) dot.classList.remove('active')
 }

 document.addEventListener('mousemove', move)
 document.addEventListener('mouseover', handleOver)
 document.addEventListener('mouseout', handleOut)

 return () => {
 document.removeEventListener('mousemove', move)
 document.removeEventListener('mouseover', handleOver)
 document.removeEventListener('mouseout', handleOut)
 }
 }, [])

 if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null

 return <div ref={dotRef} className="cursor-dot" />
}
