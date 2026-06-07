import { useRef, useState, useEffect, useCallback } from 'react'
import { rtcConfig } from '../utils/webrtcConfig'

export function useWebRTC(roomId, socket, localStream) {
  const peers = useRef({})
  const [remoteStreams, setRemoteStreams] = useState({})
  const localStreamRef = useRef(localStream)

  // Update localStreamRef when localStream changes
  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  const createPeerConnection = useCallback((peerId) => {
    const pc = new RTCPeerConnection(rtcConfig)

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current))
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { to: peerId, candidate: event.candidate })
      }
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) {
        setRemoteStreams(prev => ({ ...prev, [peerId]: stream }))
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const next = { ...prev }
          delete next[peerId]
          return next
        })
      }
    }

    peers.current[peerId] = pc
    return pc
  }, [socket])

  const hangUp = useCallback(() => {
    Object.values(peers.current).forEach(p => p.close())
    peers.current = {}
    setRemoteStreams({})
    if (socket && roomId) {
      socket.emit('leave-room', roomId)
    }
  }, [socket, roomId])

  useEffect(() => {
    if (!socket) return

    const onUserJoined = async ({ socketId }) => {
      const pc = createPeerConnection(socketId)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('offer', { to: socketId, sdp: offer })
    }

    const onOffer = async ({ from, sdp }) => {
      const pc = createPeerConnection(from)
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('answer', { to: from, sdp: answer })
    }

    const onAnswer = async ({ from, sdp }) => {
      const pc = peers.current[from]
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    }

    const onIceCandidate = async ({ from, candidate }) => {
      const pc = peers.current[from]
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (_) {}
      }
    }

    const onUserLeft = ({ socketId }) => {
      const pc = peers.current[socketId]
      if (pc) pc.close()
      delete peers.current[socketId]
      setRemoteStreams(prev => {
        const next = { ...prev }
        delete next[socketId]
        return next
      })
    }

    socket.on('participant-joined', onUserJoined)
    socket.on('offer', onOffer)
    socket.on('answer', onAnswer)
    socket.on('ice-candidate', onIceCandidate)
    socket.on('participant-left', onUserLeft)

    return () => {
      socket.off('participant-joined', onUserJoined)
      socket.off('offer', onOffer)
      socket.off('answer', onAnswer)
      socket.off('ice-candidate', onIceCandidate)
      socket.off('participant-left', onUserLeft)
    }
  }, [socket, createPeerConnection])

  useEffect(() => {
    return () => {
      hangUp()
    }
  }, [hangUp])

  const createOffer = useCallback(async (peerId) => {
    const pc = createPeerConnection(peerId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    if (socket) socket.emit('offer', { to: peerId, sdp: offer })
  }, [createPeerConnection, socket])

  return { remoteStreams, createOffer, hangUp }
}
