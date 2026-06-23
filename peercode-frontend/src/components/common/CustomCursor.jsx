import { useEffect, useRef } from 'react'

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

 const addActive = () => dot.classList.add('active')
 const removeActive = () => dot.classList.remove('active')

 document.addEventListener('mousemove', move)
 document.querySelectorAll('a, button, [role="button"], input, textarea, select').forEach(el => {
 el.addEventListener('mouseenter', addActive)
 el.addEventListener('mouseleave', removeActive)
 })

 const observer = new MutationObserver(() => {
 document.querySelectorAll('a, button, [role="button"], input, textarea, select').forEach(el => {
 el.removeEventListener('mouseenter', addActive)
 el.removeEventListener('mouseleave', removeActive)
 el.addEventListener('mouseenter', addActive)
 el.addEventListener('mouseleave', removeActive)
 })
 })
 observer.observe(document.body, { childList: true, subtree: true })

 return () => {
 document.removeEventListener('mousemove', move)
 observer.disconnect()
 }
 }, [])

 if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null

 return <div ref={dotRef} className="cursor-dot" />
}
