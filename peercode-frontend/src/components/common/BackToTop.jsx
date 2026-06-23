import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
 const [progress, setProgress] = useState(0)
 const [visible, setVisible] = useState(false)

 useEffect(() => {
 const onScroll = () => {
 const scrollTop = window.scrollY
 const docHeight = document.documentElement.scrollHeight - window.innerHeight
 const pct = docHeight > 0 ? scrollTop / docHeight : 0
 setProgress(pct)
 setVisible(scrollTop > 300)
 }
 window.addEventListener('scroll', onScroll, { passive: true })
 return () => window.removeEventListener('scroll', onScroll)
 }, [])

 if (!visible) return null

 const radius = 18
 const circumference = 2 * Math.PI * radius
 const strokeDashoffset = circumference * (1 - progress)

 return (
 <button
 onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
 className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-bg-surface border border-border-strong hover:border-indigo-500 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
 aria-label="Back to top"
 >
 <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 44 44">
 <circle
 cx="22" cy="22" r={radius}
 fill="none"
 stroke="rgba(99,102,241,0.2)"
 strokeWidth="2.5"
 />
 <circle
 cx="22" cy="22" r={radius}
 fill="none"
 stroke="rgb(99,102,241)"
 strokeWidth="2.5"
 strokeDasharray={circumference}
 strokeDashoffset={strokeDashoffset}
 strokeLinecap="round"
 />
 </svg>
 <ArrowUp className="w-4 h-4 text-indigo-400 relative z-10" />
 </button>
 )
}
