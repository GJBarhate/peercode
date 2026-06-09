import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createSocket, disconnectSocket } from '../services/socketService'
import { useAuth } from './AuthContext'
import { logger } from '../utils/logger'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { accessToken, user, isLoading: authLoading } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const connectionAttemptRef = useRef(0)
  const previousSocketIdRef = useRef(null)

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!accessToken || !user) {
      if (socketRef.current) {
        logger.debug('Disconnecting socket - no auth')
        disconnectSocket()
        socketRef.current = null
      }
      setSocket(null)
      setIsConnected(false)
      connectionAttemptRef.current = 0
      return
    }

    // If socket exists but token changed, disconnect and reconnect to re-authenticate
    if (socketRef.current && socketRef.current.auth?.token !== accessToken) {
      logger.debug('Token changed - disconnecting socket to re-authenticate')
      disconnectSocket()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
    }

    if (socketRef.current?.connected) {
      return
    }

    logger.debug('Creating new socket with auth token')
    const newSocket = createSocket(accessToken)
    socketRef.current = newSocket
    setSocket(newSocket)

    const handleConnect = () => {
      logger.debug('Socket connected successfully')
      setIsConnected(true)
      connectionAttemptRef.current = 0
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }

    // Track current room for reconnection
    const handleJoinRoom = (data) => {
      if (data?.roomId) {
        socketRef.current.currentRoom = data.roomId
        logger.debug('Joined room:', data.roomId)
      }
    }

    newSocket.on('join-room', handleJoinRoom)

    const handleDisconnect = () => {
      logger.debug('Socket disconnected')
      setIsConnected(false)
    }

    const handleError = (err) => {
      logger.error('Socket error:', err)
      setIsConnected(false)
    }

    const handleConnectError = (err) => {
      logger.error('Socket connection error:', err)
      connectionAttemptRef.current += 1
      setIsConnected(false)
    }

    const handleReconnect = () => {
      logger.debug('Socket reconnected successfully')
      setIsConnected(true)
      connectionAttemptRef.current = 0
      
      // Emit rejoin-room with previous socket ID to rejoin rooms
      if (previousSocketIdRef.current && socketRef.current?.connected) {
        logger.debug('Emitting rejoin-room with previous socket ID:', previousSocketIdRef.current)
        socketRef.current.emit('rejoin-room', {
          roomId: socketRef.current.currentRoom,
          previousSocketId: previousSocketIdRef.current,
        })
      }
      previousSocketIdRef.current = socketRef.current?.id
    }

    const handleReconnectAttempt = () => {
      connectionAttemptRef.current += 1
      logger.debug(`Socket reconnect attempt ${connectionAttemptRef.current}`)
      if (connectionAttemptRef.current > 3) {
        logger.warn('Multiple reconnection attempts - connection may be unstable')
      }
    }

    const handleReconnectError = (err) => {
      logger.error('Socket reconnection failed:', err)
      if (connectionAttemptRef.current >= 5) {
        logger.error('Max reconnection attempts reached - giving up')
      }
    }

    newSocket.on('connect', handleConnect)
    newSocket.on('disconnect', handleDisconnect)
    newSocket.on('error', handleError)
    newSocket.on('connect_error', handleConnectError)
    newSocket.on('reconnect', handleReconnect)
    newSocket.on('reconnect_attempt', handleReconnectAttempt)
    newSocket.on('reconnect_error', handleReconnectError)

    return () => {
      newSocket.off('connect', handleConnect)
      newSocket.off('disconnect', handleDisconnect)
      newSocket.off('error', handleError)
      newSocket.off('connect_error', handleConnectError)
      newSocket.off('reconnect', handleReconnect)
      newSocket.off('reconnect_attempt', handleReconnectAttempt)
      newSocket.off('reconnect_error', handleReconnectError)
      newSocket.off('join-room', handleJoinRoom)
    }
  }, [accessToken, user, authLoading])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}

export default SocketContext
