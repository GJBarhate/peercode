import { Play, Copy, Check, Lightbulb, Code2, Loader2 } from 'lucide-react'
import { useState } from 'react'

const LANGUAGES = [
 { id: 'javascript', label: 'JavaScript' },
 { id: 'typescript', label: 'TypeScript' },
 { id: 'python', label: 'Python' },
 { id: 'java', label: 'Java' },
 { id: 'cpp', label: 'C++' },
 { id: 'go', label: 'Go' }
]

export default function EditorToolbar({ language, onLanguageChange, onRun, isRunning, code, onGetHint, onAnalyze, isLoadingHint, isLoadingAnalysis }) {
 const [copied, setCopied] = useState(false)

 const handleCopy = async () => {
 if (!code) return
 await navigator.clipboard.writeText(code)
 setCopied(true)
 setTimeout(() => setCopied(false), 2000)
 }

 return (
 <div className="flex items-center justify-between px-3 py-2 bg-bg-surface border-b border-border-default">
 <div className="flex items-center gap-2">
 <select
 value={language}
 onChange={e => onLanguageChange(e.target.value)}
 className="bg-bg-elevated border border-border-strong text-text-primary text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
 >
 {LANGUAGES.map(l => (
 <option key={l.id} value={l.id}>{l.label}</option>
 ))}
 </select>
 </div>
 <div className="flex items-center gap-1.5">
 {onGetHint && (
 <button
 onClick={onGetHint}
 disabled={isLoadingHint}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-amber-300 hover:bg-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 title="Get AI hint"
 >
 {isLoadingHint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
 {isLoadingHint ? 'Thinking...' : 'AI Hints'}
 </button>
 )}
 {onAnalyze && (
 <button
 onClick={onAnalyze}
 disabled={isLoadingAnalysis}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-purple-300 hover:bg-bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 title="Analyze your code"
 >
 {isLoadingAnalysis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Code2 className="w-3.5 h-3.5" />}
 {isLoadingAnalysis ? 'Analyzing...' : 'AI Analyze'}
 </button>
 )}
 <div className="w-px h-5 bg-bg-overlay mx-1" />
 <button
 onClick={handleCopy}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
 title="Copy code"
 >
 {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
 {copied ? 'Copied' : 'Copy'}
 </button>
 {onRun && (
 <button
 onClick={onRun}
 disabled={isRunning}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Play className="w-3.5 h-3.5" />
 {isRunning ? 'Running...' : 'Run'}
 </button>
 )}
 </div>
 </div>
 )
}
