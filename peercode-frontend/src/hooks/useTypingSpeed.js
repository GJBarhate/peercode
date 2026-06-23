import { useState, useEffect, useRef, useCallback } from 'react'

const WINDOW_MS = 5000

export function useTypingSpeed(editor, socket, roomId) {
 const [localWPM, setLocalWPM] = useState(0)
 const [remoteTypingSpeeds, setRemoteTypingSpeeds] = useState({})
 const keystrokeTimestamps = useRef([])
 const emitInterval = useRef(null)

 const trackKeystroke = useCallback(() => {
   const now = Date.now()
   keystrokeTimestamps.current.push(now)
   keystrokeTimestamps.current = keystrokeTimestamps.current.filter(t => now - t < WINDOW_MS)
   const count = keystrokeTimestamps.current.length
   // chars per minute → rough WPM (avg word = 5 chars)
   const cpm = (count / WINDOW_MS) * 60000
   const wpm = Math.round(cpm / 5)
   setLocalWPM(wpm)
 }, [])

 useEffect(() => {
   if (!editor) return
   const disposable = editor.onDidChangeModelContent(() => {
     trackKeystroke()
   })
   return () => disposable.dispose()
 }, [editor, trackKeystroke])

 // Emit local typing speed periodically
 useEffect(() => {
   if (!socket || !roomId) return

   emitInterval.current = setInterval(() => {
     const now = Date.now()
     keystrokeTimestamps.current = keystrokeTimestamps.current.filter(t => now - t < WINDOW_MS)
     const count = keystrokeTimestamps.current.length
     const cpm = (count / WINDOW_MS) * 60000
     const wpm = Math.round(cpm / 5)
     setLocalWPM(wpm)

     if (wpm > 0) {
       socket.volatile.emit('typing-speed', roomId, { wpm })
     }
   }, 2000)

   return () => {
     if (emitInterval.current) clearInterval(emitInterval.current)
   }
 }, [socket, roomId])

 // Listen for remote typing speeds
 useEffect(() => {
   if (!socket) return

   const handleTypingSpeed = (data) => {
     const { socketId, username, wpm } = data
     if (!socketId) return
     setRemoteTypingSpeeds(prev => ({
       ...prev,
       [socketId]: { username, wpm, timestamp: Date.now() },
     }))
   }

   socket.on('typing-speed', handleTypingSpeed)

   // Clean up stale entries
   const cleanup = setInterval(() => {
     const now = Date.now()
     setRemoteTypingSpeeds(prev => {
       const next = { ...prev }
       let changed = false
       for (const [sid, data] of Object.entries(next)) {
         if (now - data.timestamp > 10000) {
           delete next[sid]
           changed = true
         }
       }
       return changed ? next : prev
     })
   }, 5000)

   return () => {
     socket.off('typing-speed', handleTypingSpeed)
     clearInterval(cleanup)
   }
 }, [socket])

 return { localWPM, remoteTypingSpeeds }
}
