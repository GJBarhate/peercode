import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import CodeEditor from '../editor/CodeEditor'
import EditorToolbar from '../editor/EditorToolbar'
import ProblemPanel from '../problems/ProblemPanel'
import ProblemBrowser from '../problems/ProblemBrowser'
import VideoPanel from '../video/VideoPanel'
import ChatPanel from '../chat/ChatPanel'
import TestCaseRunner from '../problems/TestCaseRunner'
import ExecutionOutput from '../problems/ExecutionOutput'
import AIHintPanel from '../gemini/AIHintPanel'
import InterviewTimer from './InterviewTimer'
import InterviewerNotes from './InterviewerNotes'
import ParticipantList from './ParticipantList'
import ConnectionQualityIndicator from '../common/ConnectionQualityIndicator'
import { useRemoteCursors } from '../../hooks/useRemoteCursors'
import { useTypingSpeed } from '../../hooks/useTypingSpeed'
import { LayoutGrid, MessageSquare, Users, ChevronRight, ChevronLeft, Lightbulb, Search, X, MessageCircle, XCircle, Video } from 'lucide-react'
import { getProblems, getErrorMessage } from '../../services/api'
import { STARTER_CODE } from '../../utils/codeTemplates'
import { PROBLEM_STARTER_CODE } from '../../data/problemStarterCode'
import toast from 'react-hot-toast'

export default function RoomLayout({
 roomId,
 room,
 participants,
 socket,
 localStream,
 remoteStreams,
 peerMediaStates,
 connectionStates = {},
 isScreenSharing,
 onScreenShare,
 onStopScreenShare,
 language,
 setLanguage,
 editorRef,
 bindToMonaco,
 userRole,
 videoQuality,
 onEndCall,
 isEnding
}) {
 const { user } = useAuth()
 const [activeRightTab, setActiveRightTab] = useState('chat')
 const [activeBottomTab, setActiveBottomTab] = useState('tests')
 const [leftPanelOpen, setLeftPanelOpen] = useState(true)
 const [bottomPanelOpen, setBottomPanelOpen] = useState(true)
 const [rightPanelOpen, setRightPanelOpen] = useState(true)
 const problemSlug = room?.problem?.slug || room?.problemSnapshot?.slug || ''
 const [code, setCode] = useState(PROBLEM_STARTER_CODE[problemSlug]?.[language] || STARTER_CODE[language] || '')
 const [showProblemSearch, setShowProblemSearch] = useState(false)
 const [searchResults, setSearchResults] = useState([])
 const [isSearching, setIsSearching] = useState(false)
 const [selectedProblem, setSelectedProblem] = useState(room?.problem || null)
 const [showProblemBrowser, setShowProblemBrowser] = useState(false)
 const [runNonce, setRunNonce] = useState(0)
 const [externalResults, setExternalResults] = useState(null)
 const [isRunning, setIsRunning] = useState(false)
 const [videoControlsOpen, setVideoControlsOpen] = useState(true)
 const [videoMaximized, setVideoMaximized] = useState(false)
 const [autoMaximizedForShare, setAutoMaximizedForShare] = useState(false)
 const [mobilePanel, setMobilePanel] = useState(null)
 const codeRef = useRef(PROBLEM_STARTER_CODE[problemSlug]?.[language] || STARTER_CODE[language] || '')
 const searchTimeoutRef = useRef(null)
 const [monacoEditor, setMonacoEditor] = useState(null)
 const [monacoInstance, setMonacoInstance] = useState(null)

 useRemoteCursors(monacoEditor, monacoInstance, socket, roomId)
 const { localWPM, remoteTypingSpeeds } = useTypingSpeed(monacoEditor, socket, roomId)

 const remoteScreenSharing = Object.values(peerMediaStates).some(s => s.isScreenSharing)

 useEffect(() => {
 if (remoteScreenSharing && !videoMaximized) {
 setVideoMaximized(true)
 setAutoMaximizedForShare(true)
 } else if (!remoteScreenSharing && autoMaximizedForShare) {
 setVideoMaximized(false)
 setAutoMaximizedForShare(false)
 }
 }, [remoteScreenSharing])

 const problem = selectedProblem || room?.problem

 useEffect(() => {
 if (room?.problem && !selectedProblem) {
 setSelectedProblem(room.problem)
 }
 }, [room?.problem, selectedProblem])

 // Listen for problem updates from other participants
 useEffect(() => {
 if (!socket) return

 const onProblemUpdated = (data) => {
 if (data.problem) {
 setSelectedProblem(data.problem)
 setLeftPanelOpen(true)
 }
 if (data.selectedBy) {
 toast.success(`${data.selectedBy} selected: ${data.problem?.title || data.problemTitle || 'a problem'}`)
 }
 }

 // Also handle the backend's native event name
 const onProblemChanged = (data) => {
 if (data.problem) {
 setSelectedProblem(data.problem)
 setLeftPanelOpen(true)
 }
 }

 const onRunCodeResult = (data) => {
 if (data.results) {
 setExternalResults(data)
 setActiveBottomTab('tests')
 setBottomPanelOpen(true)
 }
 }

 socket.on('problem-updated', onProblemUpdated)
 socket.on('run-code-result', onRunCodeResult)
 return () => {
 socket.off('problem-updated', onProblemUpdated)
 socket.off('run-code-result', onRunCodeResult)
 }
 }, [socket])

 const handleSearchProblems = async (query) => {
 if (searchTimeoutRef.current) {
 clearTimeout(searchTimeoutRef.current)
 }

 if (!query.trim()) {
 setSearchResults([])
 return
 }

 setIsSearching(true)
 searchTimeoutRef.current = setTimeout(async () => {
 try {
 const { data } = await getProblems({ search: query, limit: 8 })
 setSearchResults(data.problems || data || [])
 } catch (err) {
 toast.error(getErrorMessage(err, 'Failed to search problems'))
 setSearchResults([])
 } finally {
 setIsSearching(false)
 }
 }, 300)
 }

 const handleSelectProblem = (prob) => {
 setSelectedProblem(prob)
 toast.success(`Selected: ${prob.title}`)

 // Broadcast problem selection to all participants
 if (socket && roomId) {
 socket.emit('problem-selected', {
 roomId,
 problemId: prob._id,
 })
 }
 }

 const handleEditorMount = (editor, monaco) => {
 editorRef.current = editor
 setMonacoEditor(editor)
 if (monaco) setMonacoInstance(monaco)
 const model = editor.getModel()

 if (model && !model.getValue().trim()) {
 const slug = selectedProblem?.slug || problemSlug
 const starter = PROBLEM_STARTER_CODE[slug]?.[language] || STARTER_CODE[language] || ''
 model.setValue(starter)
 codeRef.current = starter
 setCode(starter)
 } else {
 codeRef.current = model?.getValue() || ''
 setCode(codeRef.current)
 }

 editor.onDidChangeModelContent(() => {
 codeRef.current = editor.getModel()?.getValue() || ''
 setCode(codeRef.current)
 })

 bindToMonaco?.(editor)
 }

 const handleRunComplete = (data) => {
 if (socket && roomId && data) {
 socket.emit('run-code-result', {
 roomId,
 results: data.results,
 allPassed: data.allPassed,
 passedCount: data.passedCount,
 totalCount: data.totalCount,
 language,
 runBy: user?.username || 'You',
 timestamp: Date.now()
 })
 }
 }

 const handleLanguageChange = (nextLanguage) => {
 const editor = editorRef.current
 const model = editor?.getModel()
 const currentCode = model?.getValue() || codeRef.current || ''

 setLanguage(nextLanguage)

 if (!model) {
 return
 }

 const slug = selectedProblem?.slug || problemSlug
 const currentStarter = PROBLEM_STARTER_CODE[slug]?.[language] || STARTER_CODE[language]
 if (!currentCode.trim() || currentCode === currentStarter) {
 const nextCode = PROBLEM_STARTER_CODE[slug]?.[nextLanguage] || STARTER_CODE[nextLanguage] || ''
 model.setValue(nextCode)
 codeRef.current = nextCode
 setCode(nextCode)
 }
 }

 const rightTabs = [
 { id: 'chat', label: 'Chat', icon: MessageSquare },
 { id: 'participants', label: 'People', icon: Users },
 { id: 'ai', label: 'AI Hints', icon: Lightbulb }
 ]

 return (
 <div className="flex h-screen overflow-hidden bg-bg-base flex-col lg:flex-row">
 {/* LEFT PANEL - Problem Description (Desktop/Tablet) */}
 {leftPanelOpen && (
 <div className="hidden lg:flex w-full lg:w-80 lg:flex-shrink-0 flex-col border-r border-border-default">
 <div className="flex items-center justify-between px-3 py-2 border-b border-border-default bg-bg-surface gap-2">
 <span className="text-sm font-semibold text-text-primary truncate flex-1">
 {problem?.title || 'No Problem Selected'}
 </span>
 {userRole === 'interviewer' && (
 <button
 onClick={() => setShowProblemBrowser(true)}
 className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
 title="Browse all problems (Interviewer only)"
 >
 <Search className="w-4 h-4" />
 </button>
 )}
 <button
 onClick={() => setLeftPanelOpen(false)}
 className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
 >
 <ChevronLeft className="w-4 h-4" />
 </button>
 </div>
 <div className="flex-1 overflow-hidden">
 <ProblemPanel 
 problem={problem} 
 problemId={problem?._id}
 problemSlug={problem?.slug}
 />
 </div>
 </div>
 )}

 {/* Floating video panel with controls — bottom-center dock to avoid overlapping chat */}
 {(localStream || Object.keys(remoteStreams).length > 0) && (
 <>
 {videoMaximized && (
 <div
 className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
 onClick={() => setVideoMaximized(false)}
 />
 )}
 <div
 className={`fixed z-50 transition-all duration-300 ease-in-out ${
 videoControlsOpen
 ? 'opacity-100 scale-100'
 : 'opacity-0 scale-90 pointer-events-none'
 } ${
 videoMaximized
 ? 'inset-0 flex items-center justify-center p-8'
 : 'bottom-4 left-1/2 -translate-x-1/2 lg:bottom-4 lg:left-auto lg:right-4 lg:translate-x-0'
 }`}
 >
 <div
 className={`shadow-2xl rounded-xl border border-border-default overflow-hidden bg-bg-base ${
 videoMaximized
 ? 'w-full max-w-5xl h-[80vh]'
 : remoteScreenSharing ? 'w-[36rem]' : 'w-[22rem]'
 }`}
 style={videoMaximized ? {} : { height: remoteScreenSharing ? '480px' : '320px' }}
 onClick={e => e.stopPropagation()}
 >
 <VideoPanel
 roomId={roomId}
 socket={socket}
 userId={user?.id}
 username={user?.username}
 localStream={localStream}
 remoteStreams={remoteStreams}
 peerMediaStates={peerMediaStates}
 connectionStates={connectionStates}
 participants={participants}
 isScreenSharing={isScreenSharing}
 isMaximized={videoMaximized}
 videoQuality={videoQuality}
 onEndCall={() => onEndCall?.({ finalCode: codeRef.current, finalLanguage: language, roomId })}
 onMinimize={() => setVideoControlsOpen(false)}
 onMaximize={() => setVideoMaximized(v => !v)}
 onScreenShare={onScreenShare}
 onStopScreenShare={onStopScreenShare}
 />
 </div>
 </div>
 {!videoControlsOpen && (
 <button
 onClick={() => setVideoControlsOpen(true)}
 className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 p-3 bg-bg-surface hover:bg-bg-elevated rounded-full border border-border-strong shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
 title="Show video controls"
 aria-label="Show video controls"
 >
 <Video className="w-5 h-5 text-text-secondary" />
 </button>
 )}
 </>
 )}

 {/* Floating Problem Search Dropdown (accessible to all participants) */}
 {showProblemSearch && (
 <div className="fixed top-20 right-4 z-50 w-80 shadow-2xl rounded-xl border border-border-default bg-bg-base overflow-hidden">
 <div className="flex items-center gap-1 p-2 border-b border-border-default bg-bg-surface">
 <div className="flex-1 relative">
 <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" />
 <input
 autoFocus
 type="text"
 placeholder="Search problems..."
 onChange={(e) => handleSearchProblems(e.target.value)}
 className="w-full pl-7 pr-2 py-1.5 bg-bg-elevated border border-border-strong rounded text-sm text-text-primary placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 </div>
 <button
 onClick={() => { setShowProblemSearch(false); setSearchResults([]) }}
 className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 {isSearching && <div className="px-3 py-2 text-center text-xs text-text-muted">Searching...</div>}
 {searchResults.length > 0 && (
 <div className="max-h-64 overflow-y-auto">
 {searchResults.map(prob => (
 <button
 key={prob._id || prob.id}
 onClick={() => { handleSelectProblem(prob); setShowProblemSearch(false); setSearchResults([]) }}
 className="w-full text-left px-3 py-2 hover:bg-bg-elevated transition-colors border-b border-border-default last:border-b-0"
 >
 <div className="text-sm font-medium text-text-primary truncate">{prob.title}</div>
 <div className="text-xs text-text-muted capitalize">{prob.difficulty}</div>
 </button>
 ))}
 </div>
 )}
 {!isSearching && searchResults.length === 0 && (
 <div className="px-4 py-6 text-center text-text-muted text-sm">
 Type to search problems...
 </div>
 )}
 </div>
 )}

 <div className="flex-1 flex flex-col min-w-0">
 <div className="flex items-center gap-2 px-3 py-2 border-b border-border-default bg-bg-surface flex-shrink-0 overflow-x-auto">
 {!leftPanelOpen && (
 <button
 onClick={() => setLeftPanelOpen(true)}
 className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors flex-shrink-0"
 title="Show problem details"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 )}
 {/* Role Badge */}
 <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
 userRole === 'interviewer' 
 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
 : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
 }`}>
 {userRole === 'interviewer' ? '👔 Interviewer' : '👨‍💼 Interviewee'}
 </span>
 <ConnectionQualityIndicator />
 <div className="flex-1 min-w-0" />
 <button
 onClick={() => setShowProblemSearch(true)}
 className="px-3 py-1.5 rounded-lg bg-bg-elevated hover:bg-bg-overlay text-text-secondary text-xs font-medium flex items-center gap-1.5 transition-colors"
 title="Search & select problem"
 >
 <Search className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Problem</span>
 </button>
 <InterviewTimer
 isInterviewer={userRole === 'interviewer'}
 onTimerEnd={() => onEndCall?.({ finalCode: codeRef.current, finalLanguage: language, roomId })}
 onPhaseChange={() => {}}
 socket={socket}
 roomId={roomId}
 />
 {userRole === 'interviewer' && <InterviewerNotes roomId={roomId} />}
          {onEndCall && (
            <button
              onClick={() => onEndCall({ finalCode: codeRef.current, finalLanguage: language, roomId })}
              disabled={isEnding}
 className="ml-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex-shrink-0"
 >
 {isEnding ? 'Ending...' : 'End Call'}
 </button>
 )}
 </div>

 <div className="flex-1 flex flex-col min-h-0">
 <EditorToolbar
 language={language}
 onLanguageChange={handleLanguageChange}
 code={code}
 onRun={() => {
 if (isRunning) return
 setIsRunning(true)
 setActiveBottomTab('tests')
 setBottomPanelOpen(true)
 setRunNonce(value => value + 1)
 }}
 isRunning={isRunning}
 />
 <div className="flex-1 min-h-0">
 <CodeEditor
 value={code}
 language={language}
 onMount={handleEditorMount}
 height="100%"
 typingSpeed={localWPM}
 remoteTypingSpeeds={remoteTypingSpeeds}
 />
 </div>

 {bottomPanelOpen && (
 <div className="h-40 sm:h-48 md:h-56 border-t border-border-default flex flex-col flex-shrink-0">
 <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border-default bg-bg-surface">
 {['tests', 'output'].map(tab => (
 <button
 key={tab}
 onClick={() => setActiveBottomTab(tab)}
 className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
 activeBottomTab === tab
 ? 'text-indigo-400 bg-indigo-500/10'
 : 'text-text-muted hover:text-text-secondary'
 }`}
 >
 {tab}
 </button>
 ))}
 <button
 onClick={() => setBottomPanelOpen(false)}
 className="ml-auto p-1 text-text-muted hover:text-text-secondary rounded transition-colors"
 >
 <ChevronRight className="w-3.5 h-3.5 rotate-90" />
 </button>
 </div>
 <div className="flex-1 overflow-hidden">
 {activeBottomTab === 'tests' ? (
 <TestCaseRunner
 code={code}
 language={language}
 testCases={problem?.testCases || []}
 runNonce={runNonce}
 problemSlug={problem?.slug}
 problemId={problem?._id}
 onRunComplete={handleRunComplete}
 externalResults={externalResults}
 isRunning={isRunning}
 onRunningChange={setIsRunning}
 />
 ) : (
 <ExecutionOutput
 code={code}
 language={language}
 />
 )}
 </div>
 </div>
 )}
 {!bottomPanelOpen && (
 <button
 onClick={() => setBottomPanelOpen(true)}
 className="flex items-center justify-center gap-2 py-1.5 text-xs text-text-muted hover:text-text-secondary border-t border-border-default bg-bg-surface transition-colors"
 >
 <LayoutGrid className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Show Test Panel</span>
 <span className="sm:hidden">Tests</span>
 </button>
 )}
 </div>
 </div>

 <div className="hidden lg:flex w-full lg:w-72 lg:flex-shrink-0 flex-col border-l border-border-default">
 <div className="flex items-center justify-between px-2 py-1.5 border-b border-border-default bg-bg-surface">
 <div className="flex gap-0.5">
 {rightTabs.map(({ id, label, icon: Icon }) => (
 <button
 key={id}
 onClick={() => setActiveRightTab(id)}
 className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
 activeRightTab === id
 ? 'text-indigo-400 bg-indigo-500/10'
 : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
 }`}
 >
 <Icon className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">{label}</span>
 </button>
 ))}
 </div>
 <button
 onClick={() => setRightPanelOpen(false)}
 className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors flex-shrink-0"
 title="Collapse panel"
 aria-label="Collapse right panel"
 >
 <XCircle className="w-4 h-4" />
 </button>
 </div>
 {rightPanelOpen && (
 <div className="flex-1 overflow-hidden">
 {activeRightTab === 'chat' && <ChatPanel socket={socket} roomId={roomId} />}
 {activeRightTab === 'participants' && (
 <ParticipantList participants={participants} currentUserId={user?.id} />
 )}
 {activeRightTab === 'ai' && (
 <AIHintPanel
 code={code}
 language={language}
 problem={problem}
 />
 )}
 </div>
 )}
 {!rightPanelOpen && (
 <button
 onClick={() => setRightPanelOpen(true)}
 className="flex items-center justify-center gap-2 py-2 px-2 text-xs text-text-muted hover:text-text-secondary border-t border-border-default bg-bg-surface transition-colors w-full"
 >
 <MessageSquare className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Show Chat Panel</span>
 <span className="sm:hidden">Chat</span>
 </button>
 )}
 </div>

 {showProblemBrowser && (
 <ProblemBrowser
 onSelectProblem={handleSelectProblem}
 onClose={() => setShowProblemBrowser(false)}
 />
 )}

 {/* Mobile bottom nav — access panels hidden on small screens */}
 <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-bg-surface/95 backdrop-blur-md border-t border-border-default py-2 px-1">
 {[
 { id: 'problem', label: 'Problem', icon: Search },
 { id: 'chat', label: 'Chat', icon: MessageCircle },
 { id: 'people', label: 'People', icon: Users },
 { id: 'ai', label: 'AI', icon: Lightbulb },
 ].map(({ id, label, icon: Icon }) => (
 <button
 key={id}
 onClick={() => setMobilePanel(mobilePanel === id ? null : id)}
 className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors ${
 mobilePanel === id ? 'text-indigo-400 bg-indigo-500/10' : 'text-text-muted hover:text-text-secondary'
 }`}
 >
 <Icon className="w-4 h-4" />
 <span>{label}</span>
 </button>
 ))}
 </div>

 {/* Mobile panel overlay */}
 {mobilePanel && (
 <div className="lg:hidden fixed inset-x-0 bottom-12 top-14 z-20 bg-bg-base border-t border-border-default overflow-hidden flex flex-col">
 <div className="flex items-center justify-between px-3 py-2 border-b border-border-default bg-bg-surface flex-shrink-0">
 <span className="text-sm font-semibold text-text-primary capitalize">{mobilePanel === 'ai' ? 'AI Hints' : mobilePanel}</span>
 <button onClick={() => setMobilePanel(null)} className="p-1 text-text-muted hover:text-text-primary rounded transition-colors">
 <X className="w-4 h-4" />
 </button>
 </div>
 <div className="flex-1 overflow-hidden">
 {mobilePanel === 'problem' && <ProblemPanel problem={problem} problemId={problem?._id} problemSlug={problem?.slug} />}
 {mobilePanel === 'chat' && <ChatPanel socket={socket} roomId={roomId} />}
 {mobilePanel === 'people' && <ParticipantList participants={participants} currentUserId={user?.id} />}
 {mobilePanel === 'ai' && <AIHintPanel code={code} language={language} problem={problem} />}
 </div>
 </div>
 )}
 </div>
 )
}
