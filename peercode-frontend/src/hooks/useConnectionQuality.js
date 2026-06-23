import { useState, useEffect, useRef, useCallback } from 'react'

const PING_INTERVAL = 5000
const LATENCY_HISTORY_SIZE = 10

// green: <100ms, yellow: 100-300ms, red: >300ms or disconnected
function classifyQuality(latency, isConnected) {
 if (!isConnected) return 'disconnected'
 if (latency < 0) return 'unknown'
 if (latency < 100) return 'good'
 if (latency < 300) return 'fair'
 return 'poor'
}

export function useConnectionQuality(socket, isConnected) {
 const [quality, setQuality] = useState('unknown')
 const [latency, setLatency] = useState(-1)
 const [jitter, setJitter] = useState(0)
 const latencyHistory = useRef([])
 const pingStart = useRef(0)
 const intervalRef = useRef(null)

 const measureLatency = useCallback(() => {
   if (!socket?.connected) return
   pingStart.current = performance.now()
   socket.volatile.emit('ping-measure')
 }, [socket])

 useEffect(() => {
   if (!socket) return

   const handlePong = () => {
     const rtt = Math.round(performance.now() - pingStart.current)
     if (rtt < 0 || rtt > 30000) return

     const history = latencyHistory.current
     history.push(rtt)
     if (history.length > LATENCY_HISTORY_SIZE) history.shift()

     const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length)
     setLatency(avg)

     if (history.length >= 2) {
       const diffs = history.slice(1).map((v, i) => Math.abs(v - history[i]))
       setJitter(Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length))
     }

     setQuality(classifyQuality(avg, true))
   }

   socket.on('pong-measure', handlePong)

   intervalRef.current = setInterval(measureLatency, PING_INTERVAL)
   measureLatency()

   return () => {
     socket.off('pong-measure', handlePong)
     if (intervalRef.current) clearInterval(intervalRef.current)
   }
 }, [socket, measureLatency])

 useEffect(() => {
   if (!isConnected) {
     setQuality('disconnected')
     latencyHistory.current = []
   }
 }, [isConnected])

 return { quality, latency, jitter }
}
