import { useState, useRef, useCallback, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import {
  Bot, Upload, Building2, Brain, MessageSquare, Code2,
  ChevronRight, ChevronLeft, Clock, Send, Loader2, RotateCcw,
  ArrowLeft, CheckCircle2, XCircle, Sparkles, Mic, MicOff,
  BookOpen, Users2, Cpu, Volume2, VolumeX, Timer, Target
} from 'lucide-react'
import Navbar from '../components/common/Navbar'
import { generateInterviewQuestions, generateInterviewFeedback } from '../services/api'
import toast from 'react-hot-toast'

/* ─────────────────── constants ─────────────────── */

const COMPANIES = [
  { id: 'google', name: 'Google', color: '#4285F4' },
  { id: 'amazon', name: 'Amazon', color: '#FF9900' },
  { id: 'meta', name: 'Meta', color: '#0866FF' },
  { id: 'microsoft', name: 'Microsoft', color: '#00A4EF' },
  { id: 'apple', name: 'Apple', color: '#555555' },
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
  { id: 'uber', name: 'Uber', color: '#000000' },
  { id: 'stripe', name: 'Stripe', color: '#635BFF' },
  { id: 'other', name: 'Other', color: '#6B7280' },
]

const INTERVIEW_TYPES = [
  { id: 'technical-dsa', label: 'Technical (DSA)', icon: Code2, desc: 'Data structures & algorithms', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'behavioral', label: 'Behavioral', icon: MessageSquare, desc: 'Leadership & teamwork', gradient: 'from-amber-500 to-orange-600' },
  { id: 'system-design', label: 'System Design', icon: Cpu, desc: 'Architecture & scalability', gradient: 'from-violet-500 to-purple-700' },
  { id: 'frontend', label: 'Frontend', icon: BookOpen, desc: 'React, CSS, browser APIs', gradient: 'from-cyan-500 to-blue-600' },
  { id: 'backend', label: 'Backend', icon: Brain, desc: 'APIs, databases, DevOps', gradient: 'from-rose-500 to-pink-700' },
  { id: 'hr', label: 'HR Round', icon: Users2, desc: 'Culture fit & career goals', gradient: 'from-indigo-500 to-blue-700' },
]

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', desc: 'Entry level', cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8' },
  { id: 'medium', label: 'Medium', desc: '2–5 yrs exp', cls: 'text-amber-400 border-amber-500/30 bg-amber-500/8' },
  { id: 'hard', label: 'Hard', desc: 'Senior+', cls: 'text-red-400 border-red-500/30 bg-red-500/8' },
]

const DURATIONS = [
  { mins: 10, questions: 4,  label: '10 min' },
  { mins: 15, questions: 5,  label: '15 min' },
  { mins: 20, questions: 7,  label: '20 min' },
  { mins: 30, questions: 10, label: '30 min' },
  { mins: 45, questions: 15, label: '45 min' },
]

/* ─────────────────── useSpeech hook ─────────────────── */

function useSpeech() {
  const synth = useRef(window.speechSynthesis)
  const recRef = useRef(null)
  const wantRef = useRef(false)
  const finalRef = useRef('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.continuous = true; r.interimResults = true; r.lang = 'en-US'
    r.onend = () => { setIsListening(false); if (wantRef.current) { try { r.start(); setIsListening(true) } catch {} } }
    r.onerror = e => {
      if (e.error === 'not-allowed') { toast.error('Microphone access denied'); wantRef.current = false; setIsListening(false); return }
      if (e.error !== 'aborted' && e.error !== 'no-speech' && wantRef.current) setTimeout(() => { if (wantRef.current) { try { r.start(); setIsListening(true) } catch {} } }, 300)
    }
    r.onresult = ev => {
      let fin = finalRef.current, int = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) { fin += ev.results[i][0].transcript + ' '; finalRef.current = fin }
        else int += ev.results[i][0].transcript
      }
      setTranscript(fin + int)
    }
    recRef.current = r
    return () => { synth.current.cancel(); wantRef.current = false; try { r.abort() } catch {} }
  }, [])

  const speak = useCallback((text) => {
    if (!voiceEnabled) return Promise.resolve()
    return new Promise(res => {
      synth.current.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.92; u.pitch = 1.0
      const voices = synth.current.getVoices()
      const v = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
            || voices.find(v => v.lang.startsWith('en-') && v.localService)
      if (v) u.voice = v
      u.onstart = () => setIsSpeaking(true)
      u.onend = () => { setIsSpeaking(false); res() }
      u.onerror = () => { setIsSpeaking(false); res() }
      synth.current.speak(u)
    })
  }, [voiceEnabled])

  const stopSpeaking = useCallback(() => { synth.current.cancel(); setIsSpeaking(false) }, [])

  const startListening = useCallback(async () => {
    if (!recRef.current) { toast.error('Speech recognition not supported in this browser'); return }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      toast.error('Microphone access denied. Please allow microphone permissions in your browser settings.')
      return
    }
    finalRef.current = ''; setTranscript('')
    wantRef.current = true
    try { recRef.current.start(); setIsListening(true) } catch (e) {
      if (e.name === 'InvalidStateError') {
        recRef.current.abort()
        setTimeout(() => { try { recRef.current?.start(); setIsListening(true) } catch {} }, 100)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    wantRef.current = false
    try { recRef.current?.stop() } catch {}
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => { finalRef.current = ''; setTranscript('') }, [])

  return { speak, stopSpeaking, startListening, stopListening, isSpeaking, isListening, transcript, resetTranscript, voiceEnabled, setVoiceEnabled }
}

/* ─────────────────── AIAvatar component ─────────────────── */

function AIAvatar({ isSpeaking, isListening, isThinking }) {
  const [mouth, setMouth] = useState({ open: 0, wide: 0 })
  const [blink, setBlink] = useState(true)
  const blinkTimer = useRef(null)

  useEffect(() => {
    if (!isSpeaking) { setMouth({ open: 0, wide: 0 }); return }
    let t = 0
    const id = setInterval(() => {
      t += 0.2
      const o = Math.abs(Math.sin(t)) * 0.85
      setMouth({ open: o, wide: Math.abs(Math.sin(t * 0.6)) * 0.25 })
    }, 75)
    return () => clearInterval(id)
  }, [isSpeaking])

  useEffect(() => {
    const schedule = () => {
      blinkTimer.current = setTimeout(() => {
        setBlink(false)
        setTimeout(() => { setBlink(true); schedule() }, 140)
      }, 3200 + Math.random() * 3500)
    }
    schedule()
    return () => clearTimeout(blinkTimer.current)
  }, [])

  const state = isSpeaking ? 'speaking' : isListening ? 'listening' : isThinking ? 'thinking' : 'idle'
  const glow = { speaking: 'rgba(99,102,241,0.28)', listening: 'rgba(16,185,129,0.22)', thinking: 'rgba(245,158,11,0.18)', idle: 'rgba(0,0,0,0)' }[state]
  const ring = { speaking: '#6366f1', listening: '#10b981', thinking: '#f59e0b', idle: '#374151' }[state]
  const badge = {
    speaking: 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/25',
    listening: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/25',
    thinking: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/25',
    idle: 'bg-gray-800/60 text-gray-500',
  }[state]
  const label = { speaking: '🎙 Speaking…', listening: '👂 Listening…', thinking: '💭 Thinking…', idle: 'AI Interviewer' }[state]

  const lY = 138                              // lip centre Y
  const mW = 20 + mouth.wide * 5             // half-width of mouth
  const mO = mouth.open * 11                 // open height

  return (
    <div className="relative flex flex-col items-center gap-2" style={{ userSelect: 'none' }}>
      {/* ambient glow */}
      <div className="absolute pointer-events-none rounded-full transition-all duration-700"
        style={{ width: 210, height: 210, top: -10, left: '50%', transform: 'translateX(-50%)',
          background: `radial-gradient(circle at 50% 42%, ${glow}, transparent 68%)` }} />

      {/* animated ring */}
      <div className="absolute pointer-events-none rounded-full border-[1.5px] transition-all duration-500"
        style={{ width: 186, height: 186, top: 2, left: '50%', transform: 'translateX(-50%)',
          borderColor: ring, opacity: state !== 'idle' ? 0.45 : 0.1,
          animation: state !== 'idle' ? 'avatarPulse 2.2s ease-in-out infinite' : 'none' }} />

      <svg width="190" height="215" viewBox="0 0 190 215" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* skin – warm tone */}
          <radialGradient id="sk" cx="42%" cy="32%" r="70%">
            <stop offset="0%"   stopColor="#fad7ae"/>
            <stop offset="40%"  stopColor="#e8a878"/>
            <stop offset="75%"  stopColor="#d48a5e"/>
            <stop offset="100%" stopColor="#c07242"/>
          </radialGradient>
          {/* face rim shadow */}
          <radialGradient id="rimShadow" cx="50%" cy="50%" r="50%">
            <stop offset="72%" stopColor="transparent"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.22)"/>
          </radialGradient>
          {/* hair */}
          <linearGradient id="hg" x1="95" y1="5" x2="95" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#291405"/>
            <stop offset="100%" stopColor="#130900"/>
          </linearGradient>
          {/* iris */}
          <radialGradient id="irisg" cx="32%" cy="28%" r="75%">
            <stop offset="0%"   stopColor="#64a8e8"/>
            <stop offset="50%"  stopColor="#1d5ca8"/>
            <stop offset="100%" stopColor="#0a2660"/>
          </radialGradient>
          {/* shirt */}
          <linearGradient id="shirtg" x1="95" y1="164" x2="95" y2="215" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#3d5068"/>
            <stop offset="100%" stopColor="#1c2b3a"/>
          </linearGradient>
          {/* upper lip */}
          <linearGradient id="ulip" x1="95" y1={lY-8} x2="95" y2={lY+4} gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#c05858"/>
            <stop offset="100%" stopColor="#8a2828"/>
          </linearGradient>
          {/* lower lip */}
          <linearGradient id="llip" x1="95" y1={lY+mO} x2="95" y2={lY+mO+10} gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#b85050"/>
            <stop offset="100%" stopColor="#8a2828"/>
          </linearGradient>
        </defs>

        {/* ── Neck ── */}
        <path d="M77 150 Q77 174, 79 177 L111 177 Q113 174, 113 150 Z" fill="#dba070"/>
        <rect x="80" y="153" width="30" height="7" rx="3.5" fill="#c07850" opacity="0.3"/>

        {/* ── Shirt & collar ── */}
        <path d="M18 215 C18 183, 65 170, 95 170 C125 170, 172 183, 172 215 Z" fill="url(#shirtg)"/>
        <path d="M84 171 L95 189 L106 171" fill="none" stroke="#18273a" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M73 176 Q95 185, 117 176" stroke="#2c3f56" strokeWidth="1" fill="none" opacity="0.55"/>

        {/* ── Head depth shadow ── */}
        <ellipse cx="96" cy="92" rx="57" ry="70" fill="rgba(0,0,0,0.16)"/>

        {/* ── Head ── */}
        <ellipse cx="95" cy="90" rx="57" ry="70" fill="url(#sk)"/>
        <ellipse cx="95" cy="90" rx="57" ry="70" fill="url(#rimShadow)"/>

        {/* ── Hair ── */}
        <path d="M38 81 C38 28, 63 7, 95 7 C127 7, 152 28, 152 81 C150 54, 134 20, 95 17 C56 20, 40 54, 38 81 Z" fill="url(#hg)"/>
        <path d="M38 81 C34 63, 36 42, 44 29" stroke="#130900" strokeWidth="17" strokeLinecap="round" fill="none"/>
        <path d="M152 81 C156 63, 154 42, 146 29" stroke="#130900" strokeWidth="17" strokeLinecap="round" fill="none"/>
        <path d="M68 11 Q95 5, 122 11" stroke="rgba(255,195,140,0.07)" strokeWidth="5" fill="none" strokeLinecap="round"/>

        {/* ── Ears ── */}
        <ellipse cx="38" cy="93" rx="8" ry="13" fill="#d4895c"/>
        <ellipse cx="38" cy="93" rx="4.5" ry="8" fill="#b87040" opacity="0.55"/>
        <path d="M36 85 Q32 93, 36 101" stroke="#a85e30" strokeWidth="0.8" fill="none" opacity="0.35"/>
        <ellipse cx="152" cy="93" rx="8" ry="13" fill="#d4895c"/>
        <ellipse cx="152" cy="93" rx="4.5" ry="8" fill="#b87040" opacity="0.55"/>
        <path d="M154 85 Q158 93, 154 101" stroke="#a85e30" strokeWidth="0.8" fill="none" opacity="0.35"/>

        {/* ── Eyebrows ── */}
        <path d={`M56 ${isThinking ? 68 : 72} Q67.5 ${isThinking ? 63 : 67}, 79 ${isThinking ? 68.5 : 72}`}
          stroke="#291405" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.88"/>
        <path d={`M111 ${isThinking ? 68.5 : 72} Q122.5 ${isThinking ? 63 : 67}, 134 ${isThinking ? 68 : 72}`}
          stroke="#291405" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.88"/>

        {/* ── Left eye ── */}
        <ellipse cx="67" cy="85" rx="14" ry="10.5" fill="rgba(150,80,30,0.12)"/>
        <ellipse cx="67" cy="85" rx="12.5" ry={blink ? 8.5 : 1.2} fill="white"/>
        {blink && <>
          <circle cx="67" cy="85" r="6.5" fill="url(#irisg)"/>
          <circle cx="67" cy="85" r="4"   fill="#040e1e"/>
          <circle cx="69.5" cy="82.5" r="2.3" fill="white" opacity="0.95"/>
          <circle cx="64.5" cy="87"   r="1"   fill="white" opacity="0.3"/>
          <circle cx="67" cy="85" r="6.5" fill="none" stroke="#08183a" strokeWidth="0.6"/>
        </>}
        {blink && <path d="M54 82 Q67 77, 80 82" stroke="#c07848" strokeWidth="1" fill="none" opacity="0.45"/>}
        {blink && <path d="M54 88 Q67 93, 80 88" stroke="#c07848" strokeWidth="0.7" fill="none" opacity="0.25"/>}

        {/* ── Right eye ── */}
        <ellipse cx="123" cy="85" rx="14" ry="10.5" fill="rgba(150,80,30,0.12)"/>
        <ellipse cx="123" cy="85" rx="12.5" ry={blink ? 8.5 : 1.2} fill="white"/>
        {blink && <>
          <circle cx="123" cy="85" r="6.5" fill="url(#irisg)"/>
          <circle cx="123" cy="85" r="4"   fill="#040e1e"/>
          <circle cx="125.5" cy="82.5" r="2.3" fill="white" opacity="0.95"/>
          <circle cx="120.5" cy="87"   r="1"   fill="white" opacity="0.3"/>
          <circle cx="123" cy="85" r="6.5" fill="none" stroke="#08183a" strokeWidth="0.6"/>
        </>}
        {blink && <path d="M110 82 Q123 77, 136 82" stroke="#c07848" strokeWidth="1" fill="none" opacity="0.45"/>}
        {blink && <path d="M110 88 Q123 93, 136 88" stroke="#c07848" strokeWidth="0.7" fill="none" opacity="0.25"/>}

        {/* ── Nose ── */}
        <path d="M91 104 C89 111, 86 117, 88.5 120 Q95 123, 101.5 120 C104 117, 101 111, 99 104"
          stroke="#c07848" strokeWidth="1.3" fill="none" opacity="0.65" strokeLinejoin="round"/>
        <ellipse cx="88" cy="119.5" rx="3"   ry="2"   fill="#b06838" opacity="0.28"/>
        <ellipse cx="102" cy="119.5" rx="3"  ry="2"   fill="#b06838" opacity="0.28"/>

        {/* ── Cheeks ── */}
        <ellipse cx="50"  cy="107" rx="11" ry="6.5" fill="#dd6868" opacity="0.1"/>
        <ellipse cx="140" cy="107" rx="11" ry="6.5" fill="#dd6868" opacity="0.1"/>

        {/* ── Mouth ── */}
        {isSpeaking ? (
          <g>
            {/* upper lip */}
            <path d={`M${95-mW} ${lY} Q${95-mW*0.45} ${lY-6}, 95 ${lY-3} Q${95+mW*0.45} ${lY-6}, ${95+mW} ${lY}`}
              fill="url(#ulip)" stroke="#7a2020" strokeWidth="0.8"/>
            {/* mouth cavity */}
            <ellipse cx="95" cy={lY + mO*0.4} rx={mW - 1} ry={mO + 2} fill="#5a1818"/>
            {/* teeth */}
            {mO > 3 && <rect x={95-mW+3} y={lY} width={(mW-3)*2} height={Math.min(mO * 0.6, 7)} rx="2" fill="white" opacity="0.92"/>}
            {/* tongue hint */}
            {mO > 6 && <ellipse cx="95" cy={lY + mO*0.75} rx={mW*0.55} ry="2.5" fill="#c86060" opacity="0.5"/>}
            {/* lower lip */}
            <path d={`M${95-mW} ${lY+mO*0.8+2} Q95 ${lY+mO*0.8+9}, ${95+mW} ${lY+mO*0.8+2}`}
              fill="url(#llip)" stroke="#7a2020" strokeWidth="0.8"/>
            {/* lip shine */}
            <path d={`M${95-mW*0.55} ${lY-1} Q95 ${lY-6}, ${95+mW*0.55} ${lY-1}`}
              stroke="rgba(255,210,190,0.22)" strokeWidth="1.8" fill="none"/>
          </g>
        ) : (
          <g>
            {/* upper lip bow */}
            <path d={`M${95-21} ${lY} Q${95-9} ${lY-6}, 95 ${lY-3} Q${95+9} ${lY-6}, ${95+21} ${lY}`}
              fill="#b05050" stroke="#862020" strokeWidth="0.8"/>
            {/* mouth seam */}
            <path d={isThinking ? `M${95-21} ${lY+1} Q95 ${lY+1}, ${95+21} ${lY+1}` : `M${95-21} ${lY+1} Q95 ${lY+8}, ${95+21} ${lY+1}`}
              stroke="#6e1a1a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            {/* lower lip */}
            {!isThinking && <>
              <path d={`M${95-19} ${lY+3} Q95 ${lY+11}, ${95+19} ${lY+3}`}
                fill="#b05050" stroke="none" opacity="0.55"/>
              <path d={`M${95-12} ${lY+4} Q95 ${lY+11}, ${95+12} ${lY+4}`}
                stroke="rgba(255,190,160,0.18)" strokeWidth="1.5" fill="none"/>
            </>}
          </g>
        )}

        {/* chin shadow */}
        <path d="M59 152 Q95 168, 131 152" stroke="#c07848" strokeWidth="0.9" fill="none" opacity="0.22"/>
        {/* forehead highlight */}
        <ellipse cx="95" cy="50" rx="28" ry="16" fill="rgba(255,245,225,0.07)"/>
        {/* nasolabial folds */}
        <path d="M77 112 Q73 122, 77 131" stroke="#c07848" strokeWidth="0.7" fill="none" opacity="0.18"/>
        <path d="M113 112 Q117 122, 113 131" stroke="#c07848" strokeWidth="0.7" fill="none" opacity="0.18"/>
      </svg>

      {/* State badge */}
      <div className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 whitespace-nowrap ${badge} ${isThinking ? 'animate-pulse' : ''}`}>
        {label}
      </div>
    </div>
  )
}

/* ─────────────────── SetupPhase ─────────────────── */

function SetupPhase({ config, setConfig, onStart, isLoading }) {
  const fileRef = useRef(null)
  const [step, setStep] = useState(0)

  const handleFile = e => {
    const f = e.target.files?.[0]; if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return }
    const r = new FileReader()
    r.onload = ev => { setConfig(p => ({ ...p, resume: ev.target.result })); toast.success('Resume loaded') }
    r.readAsText(f)
  }

  const dur = DURATIONS.find(d => d.mins === config.duration) || DURATIONS[2]

  const steps = [
    /* step 0 – resume & JD */
    <div key="0" className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Resume <span className="text-gray-600 font-normal">(optional)</span></label>
        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-700 hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition-all group hover:bg-indigo-500/5">
          <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFile} className="hidden"/>
          {config.resume
            ? <div className="flex items-center justify-center gap-3"><CheckCircle2 className="w-7 h-7 text-green-400"/><div><p className="text-green-400 font-semibold text-sm">Uploaded</p><p className="text-[11px] text-gray-600">{config.resume.length} chars</p></div></div>
            : <><Upload className="w-8 h-8 text-gray-600 mx-auto mb-2 group-hover:text-indigo-400 transition-colors"/><p className="text-gray-500 text-sm">Click to upload or paste below</p></>}
        </div>
        <textarea value={config.resume || ''} onChange={e => setConfig(p => ({ ...p, resume: e.target.value }))}
          placeholder="Or paste resume text here…" rows={3}
          className="mt-2 w-full bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"/>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Job Description <span className="text-gray-600 font-normal">(optional)</span></label>
        <textarea value={config.jobDescription || ''} onChange={e => setConfig(p => ({ ...p, jobDescription: e.target.value }))}
          placeholder="Paste the JD for targeted questions…" rows={3}
          className="w-full bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"/>
      </div>
    </div>,

    /* step 1 – company & type */
    <div key="1" className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">Target Company</label>
        <div className="grid grid-cols-3 gap-2">
          {COMPANIES.map(c => {
            const chosen = config.company === c.name || (c.id === 'other' && !COMPANIES.slice(0,-1).find(x => x.name === config.company))
            return (
              <button key={c.id}
                onClick={() => setConfig(p => ({ ...p, company: c.id === 'other' ? '' : c.name }))}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${chosen ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/25' : 'border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-gray-900/50'}`}>
                <div className="w-5 h-5 rounded-md mx-auto mb-1.5 flex items-center justify-center" style={{ background: c.color }}>
                  <Building2 className="w-3 h-3 text-white"/>
                </div>
                {c.name}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">Interview Type</label>
        <div className="grid grid-cols-2 gap-2">
          {INTERVIEW_TYPES.map(t => (
            <button key={t.id} onClick={() => setConfig(p => ({ ...p, interviewType: t.id }))}
              className={`p-3 rounded-xl border text-left transition-all ${config.interviewType === t.id ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/25' : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900/40'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center`}><t.icon className="w-3.5 h-3.5 text-white"/></div>
                <span className="font-semibold text-gray-200 text-xs">{t.label}</span>
              </div>
              <p className="text-[10px] text-gray-500 ml-9">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>,

    /* step 2 – difficulty & duration */
    <div key="2" className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">Difficulty</label>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map(d => (
            <button key={d.id} onClick={() => setConfig(p => ({ ...p, difficulty: d.id }))}
              className={`p-4 rounded-xl border text-center transition-all ${config.difficulty === d.id ? d.cls + ' ring-1' : 'border-gray-800 text-gray-400 hover:border-gray-700'}`}>
              <div className="font-bold text-sm mb-0.5">{d.label}</div>
              <div className="text-[10px] opacity-65">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">Interview Duration</label>
        <div className="grid grid-cols-5 gap-2">
          {DURATIONS.map(d => (
            <button key={d.mins} onClick={() => setConfig(p => ({ ...p, duration: d.mins }))}
              className={`p-3 rounded-xl border text-center transition-all ${config.duration === d.mins ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/25' : 'border-gray-800 text-gray-400 hover:border-gray-700'}`}>
              <div className="font-bold text-sm">{d.label}</div>
              <div className="text-[10px] opacity-60">{d.questions}Q</div>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Summary</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {[
            ['Company',    config.company || 'Any'],
            ['Type',       INTERVIEW_TYPES.find(t => t.id === config.interviewType)?.label || '—'],
            ['Difficulty', config.difficulty],
            ['Duration',   `${dur.label} · ${dur.questions} questions`],
          ].map(([k,v]) => (
            <div key={k}><span className="text-gray-600">{k}:</span><span className="text-gray-200 ml-1.5 capitalize">{v}</span></div>
          ))}
        </div>
      </div>
    </div>,
  ]

  return (
    <div className="max-w-xl mx-auto">
      {/* progress dots */}
      <div className="flex items-center mb-8 gap-0">
        {['Resume & JD', 'Company & Type', 'Settings'].map((lbl, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 relative">
            {i > 0 && (
              <div className="absolute left-0 top-4 w-full h-0.5 -translate-y-1/2">
                <div className={`h-full transition-all duration-500 ${i <= step ? 'bg-indigo-500' : 'bg-gray-800'}`} />
              </div>
            )}
            <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              i < step ? 'bg-indigo-500 border-indigo-500 text-white'
              : i === step ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 ring-4 ring-indigo-500/15'
              : 'bg-gray-900 border-gray-700 text-gray-600'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <p className={`text-[10px] font-medium text-center transition-colors ${i <= step ? 'text-indigo-400' : 'text-gray-600'}`}>{lbl}</p>
          </div>
        ))}
      </div>

      <div className="min-h-[360px] transition-all duration-200">{steps[step]}</div>

      <div className="flex items-center justify-between mt-8">
        <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-200 disabled:opacity-25 transition-colors">
          <ChevronLeft className="w-4 h-4"/> Back
        </button>
        {step < 2
          ? <button onClick={() => setStep(s => s+1)} disabled={step === 1 && !config.interviewType}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-35 transition-all shadow-lg shadow-indigo-500/20">
              Next <ChevronRight className="w-4 h-4"/>
            </button>
          : <button onClick={onStart} disabled={isLoading || !config.interviewType}
              className="flex items-center gap-2.5 px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white disabled:opacity-35 transition-all shadow-lg shadow-indigo-500/25">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mic className="w-4 h-4"/>}
              {isLoading ? 'Generating questions…' : 'Start Interview'}
            </button>
        }
      </div>
    </div>
  )
}

/* ─────────────────── InterviewPhase ─────────────────── */

function InterviewPhase({ questions, config, onComplete, speech }) {
  const { speak, stopSpeaking, startListening, stopListening, isSpeaking, isListening, transcript, resetTranscript, voiceEnabled, setVoiceEnabled } = speech
  const [qi, setQi] = useState(0)
  const [answers, setAnswers] = useState({})
  const [typed, setTyped] = useState('')
  const [useType, setUseType] = useState(false)
  const [globalSecs, setGlobalSecs] = useState((config.duration || 20) * 60)
  const [perSecs, setPerSecs] = useState(0)
  const globalRef = useRef(null); const perRef = useRef(null)
  const spokenRef = useRef({}); const doneRef = useRef(false)

  const perQ = Math.floor(((config.duration || 20) * 60) / questions.length)

  const finish = useCallback(() => {
    if (doneRef.current) return; doneRef.current = true
    stopSpeaking(); stopListening()
    clearInterval(globalRef.current); clearInterval(perRef.current)
    const cur = useType ? typed : transcript
    const all = { ...answers }; if (cur.trim()) all[qi] = cur
    onComplete(questions, questions.map((_, i) => all[i] || '(no answer)'))
  }, [answers, qi, typed, transcript, useType, questions, onComplete, stopSpeaking, stopListening])

  /* global timer */
  useEffect(() => {
    globalRef.current = setInterval(() => setGlobalSecs(s => { if (s <= 1) { clearInterval(globalRef.current); finish(); return 0 } return s-1 }), 1000)
    return () => clearInterval(globalRef.current)
  }, [finish])

  /* per-question timer */
  useEffect(() => {
    clearInterval(perRef.current); setPerSecs(perQ)
    perRef.current = setInterval(() => setPerSecs(s => { if (s <= 1) { clearInterval(perRef.current); return 0 } return s-1 }), 1000)
    return () => clearInterval(perRef.current)
  }, [qi, perQ])

  /* speak question on arrival */
  useEffect(() => {
    if (!questions[qi] || spokenRef.current[qi]) return
    spokenRef.current[qi] = true
    speak(questions[qi].question).then(() => { if (!useType) startListening() })
  }, [qi, questions, speak, startListening, useType])

  const next = () => {
    const ans = useType ? typed : transcript
    if (!ans.trim()) { toast.error('Please provide an answer first'); return }
    stopSpeaking(); stopListening()
    const upd = { ...answers, [qi]: ans }; setAnswers(upd)
    if (qi < questions.length - 1) { resetTranscript(); setTyped(''); setQi(qi + 1) }
    else { doneRef.current = true; clearInterval(globalRef.current); clearInterval(perRef.current); onComplete(questions, questions.map((_, i) => upd[i] || '(no answer)')) }
  }

  const skip = () => { stopListening(); resetTranscript(); setTyped(''); setQi(qi + 1) }

  const q = questions[qi]
  const gM = Math.floor(globalSecs / 60), gS = globalSecs % 60
  const pM = Math.floor(perSecs / 60), pS = perSecs % 60
  const isLast = qi === questions.length - 1
  const lowGlobal = globalSecs < 120, lowPer = perSecs < 30

  return (
    <div className="max-w-5xl mx-auto">
      {/* top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono font-bold text-sm transition-all ${lowGlobal ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/20' : 'bg-gray-900 text-gray-200 border border-gray-800'}`}>
          <Timer className="w-4 h-4"/> {gM}:{gS.toString().padStart(2,'0')}
          <span className="text-xs font-normal opacity-50 ml-1">total</span>
        </div>

        {/* dots progress */}
        <div className="flex items-center gap-1.5">
          {questions.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${i < qi ? 'w-5 h-2 bg-indigo-500' : i === qi ? 'w-8 h-2 bg-indigo-400' : 'w-2 h-2 bg-gray-800'}`}/>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-12 h-12">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke={lowPer ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'} strokeWidth="3"/>
              <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" strokeLinecap="round"
                stroke={lowPer ? '#ef4444' : '#6366f1'}
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - Math.min(perSecs / perQ, 1))}
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}/>
            </svg>
            <span className={`text-[10px] font-bold font-mono tabular-nums z-10 ${lowPer ? 'text-red-400' : 'text-gray-300'}`}>
              {pM}:{pS.toString().padStart(2,'0')}
            </span>
          </div>
          <span className="text-xs text-gray-600">Q{qi+1}/{questions.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        {/* avatar */}
        <div className="flex flex-col items-center pt-1">
          <AIAvatar isSpeaking={isSpeaking} isListening={isListening} isThinking={false}/>
          <button onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${voiceEnabled ? 'bg-indigo-500/15 text-indigo-300' : 'bg-gray-800 text-gray-500'}`}>
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5"/> : <VolumeX className="w-3.5 h-3.5"/>}
            {voiceEnabled ? 'Voice on' : 'Voice off'}
          </button>
        </div>

        {/* Q + A */}
        <div className="flex flex-col gap-4">
          {/* question card */}
          <div className="bg-gray-900/70 border border-gray-800/80 rounded-2xl p-5">
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 text-[11px] font-bold">Q{qi+1}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                q?.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-400' : q?.difficulty === 'hard' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
              }`}>{q?.difficulty || 'medium'}</span>
              {q?.expectedTopics?.slice(0,3).map((t,i) => <span key={i} className="px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded text-[10px] hidden sm:inline">{t}</span>)}
            </div>
            <p className="text-gray-100 text-sm leading-relaxed">{q?.question}</p>
          </div>

          {/* answer area */}
          <div className="bg-gray-900/50 border border-gray-800/80 rounded-2xl p-5 min-h-[180px] relative flex flex-col">
            {useType
              ? <textarea value={typed} onChange={e => setTyped(e.target.value)} placeholder="Type your answer here…" autoFocus
                  className="flex-1 bg-transparent text-gray-200 text-sm leading-relaxed placeholder-gray-700 focus:outline-none resize-none"/>
              : <div className="flex-1">
                  {transcript
                    ? <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {transcript}
                        <span className={`inline-block w-[2px] h-4 ml-0.5 align-text-bottom rounded-full ${isListening ? 'bg-emerald-400 animate-blink' : 'opacity-0'}`}/>
                      </p>
                    : <div className="h-full flex flex-col items-center justify-center text-center py-8">
                        {isListening
                          ? <><div className="flex items-end gap-[3px] h-8 mb-3">{[...Array(7)].map((_,i) => <div key={i} className="w-[3px] bg-emerald-500 rounded-full animate-soundBar" style={{ animationDelay: `${i*0.09}s`}}/>)}</div><p className="text-emerald-400 text-sm font-medium">Listening… speak clearly</p></>
                          : <><Mic className="w-9 h-9 text-gray-800 mb-2"/><p className="text-gray-600 text-sm">Press mic to start speaking</p></>}
                      </div>}
                </div>}
            <button onClick={() => { setUseType(u => !u); if (isListening) stopListening() }}
              className="absolute top-3.5 right-3.5 text-[11px] px-2.5 py-1 rounded-lg bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
              {useType ? '🎤 Voice' : '⌨ Type'}
            </button>
          </div>

          {/* controls */}
          <div className="flex items-center gap-3">
            {!useType && (
              <button onClick={() => isListening ? stopListening() : startListening()}
                className={`p-3.5 rounded-2xl transition-all ${isListening ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 ring-4 ring-red-600/15' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'}`}>
                {isListening ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
              </button>
            )}
            <button onClick={next} disabled={useType ? !typed.trim() : !transcript.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20">
              <Send className="w-4 h-4"/>{isLast ? 'Submit & Finish' : 'Submit & Next'}
            </button>
            {!isLast && (
              <button onClick={skip} className="px-4 py-3.5 rounded-2xl text-sm text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-700 transition-all">
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── FeedbackPhase ─────────────────── */

function FeedbackPhase({ feedback, onRestart }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 200); return () => clearTimeout(t) }, [])
  const sc = feedback.overallScore || 0
  const isHire = feedback.verdict?.includes('Hire') && !feedback.verdict?.includes('No')
  const isLean = feedback.verdict?.startsWith('Lean')
  const scoreColor = sc >= 70 ? '#22c55e' : sc >= 45 ? '#f59e0b' : '#ef4444'
  const verdictCls = isHire ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                   : isLean ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                   : 'bg-red-500/15 text-red-400 border-red-500/25'
  const circ = 2 * Math.PI * 52
  const offset = circ - (sc / 100) * circ

  return (
    <div className={`max-w-2xl mx-auto space-y-5 pb-12 transition-all duration-500 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* score card */}
      <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.06),transparent_65%)] pointer-events-none"/>
        <h2 className="text-base font-bold text-gray-300 mb-6">Interview Complete</h2>
        <div className="relative w-32 h-32 mx-auto mb-5">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 116 116">
            <circle cx="58" cy="58" r="52" fill="none" stroke="#1f2937" strokeWidth="7"/>
            <circle cx="58" cy="58" r="52" fill="none" strokeWidth="7" strokeLinecap="round"
              stroke={scoreColor} strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black" style={{ color: scoreColor }}>{sc}</span>
            <span className="text-[11px] text-gray-600">/100</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="px-3 py-1.5 bg-indigo-500/15 text-indigo-300 rounded-lg text-sm font-bold">{feedback.grade}</span>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${verdictCls}`}>{feedback.verdict}</span>
        </div>
        <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">{feedback.summary}</p>
      </div>

      {/* topic breakdown */}
      {feedback.topicBreakdown?.length > 0 && (
        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-400"/> Topic Breakdown</h3>
          <div className="space-y-3.5">
            {feedback.topicBreakdown.map((t, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-gray-400">{t.topic}</span>
                  <span className={`text-sm font-bold ${t.score >= 7 ? 'text-emerald-400' : t.score >= 4 ? 'text-amber-400' : 'text-red-400'}`}>{t.score}/10</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${t.score >= 7 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : t.score >= 4 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                    style={{ width: `${t.score * 10}%` }}/>
                </div>
                {t.comment && <p className="text-[11px] text-gray-600 mt-1">{t.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* strengths + areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
          <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Strengths</h3>
          <ul className="space-y-2.5">{feedback.strengths?.map((s,i) => <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300"><span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>{s}</li>)}</ul>
        </div>
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-5">
          <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2"><XCircle className="w-4 h-4"/> Improvements</h3>
          <ul className="space-y-2.5">{feedback.areasToImprove?.map((s,i) => <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300"><span className="text-red-500 mt-0.5 flex-shrink-0">✗</span>{s}</li>)}</ul>
        </div>
      </div>

      {/* recommendations */}
      {feedback.recommendations?.length > 0 && (
        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-5">
          <h3 className="text-sm font-bold text-indigo-400 mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Action Plan</h3>
          <div className="space-y-3">
            {feedback.recommendations.map((r,i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <button onClick={onRestart} className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20">
          <RotateCcw className="w-4 h-4"/> Practice Again
        </button>
      </div>
    </div>
  )
}

/* ─────────────────── Main page ─────────────────── */

export default function AIInterviewPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('setup')
  const [config, setConfig] = useState({ resume: '', jobDescription: '', company: '', interviewType: '', difficulty: 'medium', duration: 20 })
  const [questions, setQuestions] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const speech = useSpeech()

  const startInterview = async () => {
    setIsLoading(true)
    const dur = DURATIONS.find(d => d.mins === config.duration) || DURATIONS[2]
    try {
      const HISTORY_KEY = `peercode_interview_history_${config.interviewType}`
      let excludeQuestions = []
      try { excludeQuestions = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch (_) {}
      const { data } = await generateInterviewQuestions({
        resume: config.resume,
        jobDescription: config.jobDescription,
        company: config.company,
        interviewType: config.interviewType,
        difficulty: config.difficulty,
        questionCount: dur.questions,
        excludeQuestions: excludeQuestions.slice(-30),
      })
      const qs = data.data?.questions || data.questions || []
      if (!qs.length) { toast.error('No questions generated — try again'); setIsLoading(false); return }
      try {
        const newHistory = [...excludeQuestions, ...qs.map(q => q.question || '').filter(Boolean)].slice(-60)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
      } catch (_) {}
      setQuestions(qs)
      setPhase('interview')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to generate questions')
    }
    setIsLoading(false)
  }

  const handleComplete = async (qs, ans) => {
    setIsLoading(true); setPhase('loading')
    try {
      const { data } = await generateInterviewFeedback({ questions: qs, answers: ans, evaluations: [], interviewType: config.interviewType, company: config.company })
      const fb = data.data?.feedback || data.feedback
      setFeedback(fb); setPhase('feedback')
      speech.speak(`Interview complete. Your score is ${fb?.overallScore ?? 0} out of 100. Verdict: ${fb?.verdict ?? 'pending'}.`)
    } catch { toast.error('Failed to generate feedback'); setPhase('setup') }
    setIsLoading(false)
  }

  const restart = () => { setPhase('setup'); setQuestions([]); setFeedback(null); speech.resetTranscript() }

  return (
    <div className="min-h-screen bg-gray-950">
      <Helmet>
        <title>AI Interview | PeerCode</title>
        <meta name="description" content="Practice mock interviews with AI-powered feedback" />
      </Helmet>
      <Navbar/>
      <main className="pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto mb-8">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-300 text-sm mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4"/> Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Bot className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">AI Mock Interview</h1>
              <p className="text-sm text-gray-500 mt-0.5">Voice-powered practice with an AI interviewer</p>
            </div>
          </div>
        </div>

        {phase === 'setup'     && <SetupPhase config={config} setConfig={setConfig} onStart={startInterview} isLoading={isLoading}/>}
        {phase === 'interview' && <InterviewPhase questions={questions} config={config} onComplete={handleComplete} speech={speech}/>}
        {phase === 'loading'   && (
          <div className="flex flex-col items-center justify-center py-28 gap-5">
            <div className="relative w-14 h-14">
              <Loader2 className="w-14 h-14 text-indigo-500 animate-spin"/>
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping"/>
            </div>
            <div className="text-center">
              <p className="text-gray-300 font-semibold text-base mb-1">Analysing your interview…</p>
              <p className="text-gray-600 text-sm">Evaluating {questions.length} answers with AI</p>
            </div>
          </div>
        )}
        {phase === 'feedback'  && feedback && <FeedbackPhase feedback={feedback} onRestart={restart}/>}
      </main>

      <style>{`
        @keyframes avatarPulse { 0%,100%{transform:translateX(-50%) scale(1);opacity:.45} 50%{transform:translateX(-50%) scale(1.07);opacity:.15} }
        @keyframes soundBar    { 0%{height:5px}  100%{height:22px} }
        @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0} }
        .animate-soundBar { animation: soundBar .32s ease-in-out infinite alternate; }
        .animate-blink    { animation: blink .75s step-end infinite; }
      `}</style>
    </div>
  )
}
