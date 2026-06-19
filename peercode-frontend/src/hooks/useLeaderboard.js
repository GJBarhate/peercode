import { useState, useEffect, useRef } from 'react'
import { io as socketIO } from 'socket.io-client'
import { API_BASE_URL } from '../services/api'

const socketUrl = (API_BASE_URL || '').replace(/\/api\/?$/, '')

export function useLeaderboard() {
  const [rows, setRows] = useState([])
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const sock = socketIO(`${socketUrl}/leaderboard`, {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = sock

    sock.on('connect', () => setConnected(true))
    sock.on('disconnect', () => setConnected(false))

    sock.on('leaderboard-snapshot', (data) => {
      setRows(data)
    })

    sock.on('leaderboard-update', (diff) => {
      setRows(prev => {
        const map = new Map(prev.map(r => [r.username, r]))
        diff.forEach(r => map.set(r.username, r))
        return Array.from(map.values()).sort((a, b) => a.rank - b.rank)
      })
    })

    return () => {
      sock.disconnect()
      socketRef.current = null
    }
  }, [])

  return { rows, connected }
}
