import confetti from 'canvas-confetti'

export function celebrateSuccess() {
 const duration = 2000
 const end = Date.now() + duration

 const colors = ['#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#22d3ee', '#34d399']

 ;(function frame() {
 confetti({
 particleCount: 3,
 angle: 60,
 spread: 55,
 origin: { x: 0, y: 0.7 },
 colors,
 })
 confetti({
 particleCount: 3,
 angle: 120,
 spread: 55,
 origin: { x: 1, y: 0.7 },
 colors,
 })

 if (Date.now() < end) requestAnimationFrame(frame)
 })()
}

export function burstConfetti() {
 confetti({
 particleCount: 100,
 spread: 70,
 origin: { y: 0.6 },
 colors: ['#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#fbbf24'],
 })
}
