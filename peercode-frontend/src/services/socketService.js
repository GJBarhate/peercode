import { io } from 'socket.io-client'

let socketInstance = null

const isDev = import.meta.env.DEV
const socketUrl = import.meta.env.VITE_SOCKET_URL || (isDev ? 'http://localhost:5000' : null)

if (!socketUrl) {
 throw new Error('VITE_SOCKET_URL must be configured')
}

export function createSocket(token) {
 if (socketInstance) {
 socketInstance.disconnect()
 socketInstance = null
 }

 socketInstance = io(socketUrl, {
 auth: { token },
 transports: ['websocket', 'polling'],
 reconnection: true,
 reconnectionDelay: 1000,
 reconnectionDelayMax: 5000,
 reconnectionAttempts: 15,
 forceNew: true,
 })

 return socketInstance
}

export function getSocket() {
 return socketInstance
}

export function disconnectSocket() {
 if (socketInstance) {
 socketInstance.disconnect()
 socketInstance = null
 }
}
