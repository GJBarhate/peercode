import { useState, useRef, useCallback, useEffect } from 'react'
import { logger } from '../utils/logger'

export function useBackgroundBlur() {
 const [isBlurEnabled, setIsBlurEnabled] = useState(false)
 const [blurMode, setBlurMode] = useState('none') // 'none' | 'blur' | 'image'
 const canvasRef = useRef(null)
 const videoRef = useRef(null)
 const animFrameRef = useRef(null)
 const processedStreamRef = useRef(null)
 const originalStreamRef = useRef(null)

 const startBlur = useCallback(async (stream, mode = 'blur') => {
   if (!stream) return stream

   const videoTrack = stream.getVideoTracks()[0]
   if (!videoTrack) return stream

   // Try native backgroundBlur constraint first (Chrome 103+)
   const capabilities = videoTrack.getCapabilities?.()
   if (capabilities?.backgroundBlur) {
     try {
       await videoTrack.applyConstraints({ backgroundBlur: true })
       setIsBlurEnabled(true)
       setBlurMode(mode)
       logger.debug('[BackgroundBlur] Using native backgroundBlur')
       return stream
     } catch (_) {
       logger.debug('[BackgroundBlur] Native backgroundBlur not supported, using canvas fallback')
     }
   }

   // Canvas-based blur fallback
   originalStreamRef.current = stream

   const video = document.createElement('video')
   video.srcObject = stream
   video.muted = true
   video.playsInline = true
   await video.play()
   videoRef.current = video

   const canvas = document.createElement('canvas')
   canvas.width = video.videoWidth || 640
   canvas.height = video.videoHeight || 480
   canvasRef.current = canvas

   const ctx = canvas.getContext('2d', { willReadFrequently: true })

   const processFrame = () => {
     if (!videoRef.current || !canvasRef.current) return

     const w = canvas.width
     const h = canvas.height

     // Draw the original frame
     ctx.drawImage(video, 0, 0, w, h)

     if (mode === 'blur') {
       // Apply a CSS-like blur using a scaled-down approach
       // Draw small then scale up for performance-friendly blur
       const tempCanvas = document.createElement('canvas')
       const scale = 0.1
       tempCanvas.width = w * scale
       tempCanvas.height = h * scale
       const tempCtx = tempCanvas.getContext('2d')

       // Draw the current frame to a tiny canvas (effectively downsamples)
       tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)

       // Draw the center area (person) sharp over the blurred background
       // Since we can't do real segmentation without ML, apply a vignette-style blur:
       // sharp center oval, blurred edges
       ctx.filter = 'blur(12px)'
       ctx.drawImage(video, 0, 0, w, h)
       ctx.filter = 'none'

       // Draw a sharp center ellipse (approximates person region)
       ctx.save()
       ctx.beginPath()
       ctx.ellipse(w / 2, h / 2, w * 0.35, h * 0.45, 0, 0, Math.PI * 2)
       ctx.clip()
       ctx.drawImage(video, 0, 0, w, h)
       ctx.restore()
     }

     animFrameRef.current = requestAnimationFrame(processFrame)
   }

   processFrame()

   const processedStream = canvas.captureStream(30)
   // Keep audio from original stream
   const audioTracks = stream.getAudioTracks()
   audioTracks.forEach(t => processedStream.addTrack(t))
   processedStreamRef.current = processedStream

   setIsBlurEnabled(true)
   setBlurMode(mode)
   logger.debug('[BackgroundBlur] Canvas blur enabled')

   return processedStream
 }, [])

 const stopBlur = useCallback(() => {
   if (animFrameRef.current) {
     cancelAnimationFrame(animFrameRef.current)
     animFrameRef.current = null
   }
   if (videoRef.current) {
     videoRef.current.pause()
     videoRef.current.srcObject = null
     videoRef.current = null
   }
   canvasRef.current = null

   // Try to disable native blur
   if (originalStreamRef.current) {
     const videoTrack = originalStreamRef.current.getVideoTracks()[0]
     if (videoTrack?.getCapabilities?.()?.backgroundBlur) {
       videoTrack.applyConstraints({ backgroundBlur: false }).catch(() => {})
     }
   }

   processedStreamRef.current = null
   setIsBlurEnabled(false)
   setBlurMode('none')
   logger.debug('[BackgroundBlur] Blur disabled')

   return originalStreamRef.current
 }, [])

 useEffect(() => {
   return () => {
     if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
   }
 }, [])

 return {
   isBlurEnabled,
   blurMode,
   startBlur,
   stopBlur,
   originalStream: originalStreamRef.current,
 }
}
