import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Plus, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PHASES = {
  setup: { label: 'Setup', duration: 300, color: '#818cf8' },
  coding: { label: 'Coding', duration: 2100, color: '#6366f1' },
  qa: { label: 'Q&A', duration: 300, color: '#f59e0b' },
  ended: { label: 'Ended', duration: 0, color: '#22c55e' }
}

const PHASE_ORDER = ['setup', 'coding', 'qa', 'ended']

function playAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 440
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
    osc.onended = () => ctx.close()
  } catch (_) {}
}

export default function InterviewTimer({ isInterviewer, onPhaseChange, onTimerEnd, socket, roomId }) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(PHASES.setup.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [bonusUsed, setBonusUsed] = useState(false)
  const [showEndOverlay, setShowEndOverlay] = useState(false)
  const warned10 = useRef(false)
  const warned5 = useRef(false)
  const warned1 = useRef(false)
  const intervalRef = useRef(null)
  const isSynced = useRef(false)

  const currentPhaseKey = PHASE_ORDER[phaseIndex]
  const currentPhase = PHASES[currentPhaseKey]
  const phaseDuration = currentPhase.duration || 1

  const advancePhase = useCallback(() => {
    if (phaseIndex >= PHASE_ORDER.length - 1) {
      setHasEnded(true)
      setIsRunning(false)
      setShowEndOverlay(true)
      playAlert()
      if (socket && roomId) {
        socket.emit('timer_ended', { roomId })
      }
      if (onTimerEnd) onTimerEnd()
      return
    }
    const nextIndex = phaseIndex + 1
    const nextKey = PHASE_ORDER[nextIndex]
    setPhaseIndex(nextIndex)
    setTimeLeft(PHASES[nextKey].duration || 0)
    warned10.current = false
    warned5.current = false
    warned1.current = false
    toast(`Phase: ${PHASES[nextKey].label}`, { icon: '⏱️' })
    if (socket && roomId) {
      socket.emit('timer_advanced', { roomId, phaseIndex: nextIndex, timeLeft: PHASES[nextKey].duration || 0, bonusUsed })
    }
    if (onPhaseChange) onPhaseChange(nextKey)
  }, [phaseIndex, onPhaseChange, onTimerEnd, socket, roomId, bonusUsed])

  useEffect(() => {
    if (!isRunning || isPaused) {
      clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (currentPhaseKey === 'coding') {
          if (t <= 600 && !warned10.current) {
            warned10.current = true
            toast('10 minutes remaining', { icon: '⚠️' })
          }
          if (t <= 300 && !warned5.current) {
            warned5.current = true
            toast('5 minutes remaining', { icon: '⚠️' })
          }
          if (t <= 60 && !warned1.current) {
            warned1.current = true
            playAlert()
            toast.error('1 minute remaining!')
          }
        }
        if (t <= 1) {
          clearInterval(intervalRef.current)
          advancePhase()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [isRunning, isPaused, currentPhaseKey, advancePhase])

  // Sync timer state from socket (non-interviewer receives)
  useEffect(() => {
    if (!socket || isInterviewer) return

    const onTimerStarted = (data) => {
      setIsRunning(true)
      setIsPaused(false)
      setPhaseIndex(0)
      setTimeLeft(data.durationSeconds || PHASES.setup.duration)
      isSynced.current = true
    }

    const onTimerPaused = () => {
      setIsPaused(true)
    }

    const onTimerResumed = () => {
      setIsPaused(false)
    }

    const onTimerAdvanced = (data) => {
      if (data.phaseIndex != null) setPhaseIndex(data.phaseIndex)
      if (data.timeLeft != null) setTimeLeft(data.timeLeft)
      if (data.bonusUsed != null) setBonusUsed(data.bonusUsed)
    }

    const onTimerEnded = () => {
      setHasEnded(true)
      setIsRunning(false)
      setShowEndOverlay(true)
    }

    socket.on('timer_started', onTimerStarted)
    socket.on('timer_paused', onTimerPaused)
    socket.on('timer_resumed', onTimerResumed)
    socket.on('timer_advanced', onTimerAdvanced)
    socket.on('timer_ended', onTimerEnded)

    return () => {
      socket.off('timer_started', onTimerStarted)
      socket.off('timer_paused', onTimerPaused)
      socket.off('timer_resumed', onTimerResumed)
      socket.off('timer_advanced', onTimerAdvanced)
      socket.off('timer_ended', onTimerEnded)
    }
  }, [socket, isInterviewer])

  // Keyboard shortcuts for timer (Ctrl+Shift+Space for pause/resume, Ctrl+Shift+N for next phase)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isInterviewer) {
        if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
          e.preventDefault()
          const nextPaused = !isPaused
          setIsPaused(nextPaused)
          if (socket && roomId) {
            socket.emit(nextPaused ? 'pause_timer' : 'resume_timer', { roomId })
          }
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'N') {
          e.preventDefault()
          advancePhase()
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isInterviewer, isPaused, advancePhase, socket, roomId])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const circumference = 2 * Math.PI * 12
  const progress = timeLeft / phaseDuration
  const dashOffset = circumference * (1 - progress)
  
  // Warning states for colors
  const isWarningTime = currentPhaseKey === 'coding' && timeLeft < 300 && timeLeft > 60
  const isCriticalTime = currentPhaseKey === 'coding' && timeLeft <= 60 && timeLeft > 0
  let displayColor = currentPhase.color
  if (isCriticalTime) displayColor = '#ef4444' // red for critical
  else if (isWarningTime) displayColor = '#f59e0b' // amber for warning

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border transition-colors ${
      isCriticalTime ? 'border-red-500/50' : isWarningTime ? 'border-amber-500/30' : 'border-gray-800'
    }`}>
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
          <circle cx="16" cy="16" r="12" fill="none" stroke="#1f2937" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="12"
            fill="none"
            stroke={displayColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke 200ms ease, stroke-dashoffset 1s linear' }}
          />
        </svg>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-bold tabular-nums transition-colors ${
          isCriticalTime ? 'text-red-400' : isWarningTime ? 'text-amber-400' : 'text-gray-100'
        }`}>{formatTime(timeLeft)}</span>
        <span className={`text-[10px] capitalize transition-colors hidden sm:inline ${
          isCriticalTime ? 'text-red-400' : isWarningTime ? 'text-amber-400' : 'text-gray-500'
        }`}>
          {currentPhase.label}
        </span>
      </div>

      {isInterviewer && !hasEnded && (
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={() => {
              if (!isRunning) {
                setIsRunning(true)
                if (socket && roomId) {
                  socket.emit('start_timer', {
                    roomId,
                    durationSeconds: timeLeft
                  })
                }
              } else {
                const nextPaused = !isPaused
                setIsPaused(nextPaused)
                if (socket && roomId) {
                  socket.emit(nextPaused ? 'pause_timer' : 'resume_timer', { roomId })
                }
              }
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            aria-label={!isRunning ? 'Start timer' : isPaused ? 'Resume timer' : 'Pause timer'}
            title={!isRunning ? 'Start (Space)' : isPaused ? 'Resume (Space)' : 'Pause (Space)'}
          >
            {!isRunning ? <Play className="w-3 h-3" /> : isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
          {!bonusUsed && currentPhaseKey === 'coding' && (
            <button
              onClick={() => {
                setBonusUsed(true)
                setTimeLeft(t => t + 300)
                toast('+5 min added', { icon: '⏰' })
                if (socket && roomId) {
                  socket.emit('timer_advanced', { roomId, phaseIndex, timeLeft: timeLeft + 300, bonusUsed: true })
                }
              }}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
              aria-label="Add 5 minutes bonus time (1 use)"
              title="Add 5 minutes (1 use)"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}

      {showEndOverlay && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <AlertCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-100 mb-2">Time is up!</h3>
            <p className="text-gray-400 text-sm mb-6">The session timer has completed.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowEndOverlay(false)}
                className="px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-100 font-semibold text-sm border border-gray-700 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => { setShowEndOverlay(false); if (onTimerEnd) onTimerEnd() }}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
