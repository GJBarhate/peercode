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
import { LayoutGrid, MessageSquare, Users, ChevronRight, ChevronLeft, Lightbulb, Search, X, MessageCircle, XCircle } from 'lucide-react'
import { getProblems, getErrorMessage } from '../../services/api'
import { STARTER_CODE } from '../../utils/codeTemplates'
import toast from 'react-hot-toast'

export default function RoomLayout({
  roomId,
  room,
  participants,
  socket,
  localStream,
  remoteStreams,
  language,
  setLanguage,
  editorRef,
  bindToMonaco,
  userRole,
  onEndCall,
  isEnding
}) {
  const { user } = useAuth()
  const [activeRightTab, setActiveRightTab] = useState('chat')
  const [activeBottomTab, setActiveBottomTab] = useState('tests')
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [code, setCode] = useState(STARTER_CODE[language] || '')
  const [showProblemSearch, setShowProblemSearch] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProblem, setSelectedProblem] = useState(room?.problem || null)
  const [showProblemBrowser, setShowProblemBrowser] = useState(false)
  const [runNonce, setRunNonce] = useState(0)
  const [externalResults, setExternalResults] = useState(null)
  const codeRef = useRef(STARTER_CODE[language] || '')
  const searchTimeoutRef = useRef(null)

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
    socket.on('problem_changed', onProblemChanged)
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

  const handleEditorMount = (editor) => {
    editorRef.current = editor
    const model = editor.getModel()

    if (model && !model.getValue().trim()) {
      const starter = STARTER_CODE[language] || ''
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

    if (!currentCode.trim() || currentCode === STARTER_CODE[language]) {
      const nextCode = STARTER_CODE[nextLanguage] || ''
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
    <div className="flex h-screen overflow-hidden bg-gray-950 flex-col lg:flex-row">
      {/* LEFT PANEL - Problem Description (Desktop/Tablet) */}
      {leftPanelOpen && (
        <div className="hidden lg:flex w-full lg:w-80 lg:flex-shrink-0 flex-col border-r border-gray-800">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900 gap-2">
            <span className="text-sm font-semibold text-gray-200 truncate flex-1">
              {problem?.title || 'No Problem Selected'}
            </span>
            {userRole === 'interviewer' && (
              <button
                onClick={() => setShowProblemBrowser(true)}
                className="p-1 text-gray-500 hover:text-gray-200 rounded transition-colors"
                title="Browse all problems (Interviewer only)"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setLeftPanelOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-200 rounded transition-colors"
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

      {/* Floating video panel - always visible when streams exist */}
      {(localStream || Object.keys(remoteStreams).length > 0) && (
        <div className="fixed bottom-4 right-4 z-40 w-72 shadow-2xl rounded-xl border border-gray-800 overflow-hidden" style={{ height: '220px' }}>
          <VideoPanel
            roomId={roomId}
            socket={socket}
            username={user?.username}
            localStream={localStream}
            remoteStreams={remoteStreams}
            onEndCall={onEndCall}
          />
        </div>
      )}

      {/* Floating Problem Search Dropdown (for interviewer, accessible anytime) */}
      {showProblemSearch && userRole === 'interviewer' && (
        <div className="fixed top-20 right-4 z-50 w-80 shadow-2xl rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="flex items-center gap-1 p-2 border-b border-gray-800 bg-gray-900">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
              <input
                autoFocus
                type="text"
                placeholder="Search problems..."
                onChange={(e) => handleSearchProblems(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => { setShowProblemSearch(false); setSearchResults([]) }}
              className="p-1.5 text-gray-500 hover:text-gray-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {isSearching && <div className="px-3 py-2 text-center text-xs text-gray-500">Searching...</div>}
          {searchResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              {searchResults.map(prob => (
                <button
                  key={prob._id || prob.id}
                  onClick={() => { handleSelectProblem(prob); setShowProblemSearch(false); setSearchResults([]) }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0"
                >
                  <div className="text-sm font-medium text-gray-200 truncate">{prob.title}</div>
                  <div className="text-xs text-gray-500 capitalize">{prob.difficulty}</div>
                </button>
              ))}
            </div>
          )}
          {!isSearching && searchResults.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              Type to search problems...
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 bg-gray-900 flex-shrink-0 overflow-x-auto">
          {!leftPanelOpen && (
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="p-1.5 text-gray-500 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
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
           <div className="flex-1 min-w-0" />
          {userRole === 'interviewer' && (
            <button
              onClick={() => setShowProblemSearch(true)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Search & select problem"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Problem</span>
            </button>
          )}
          <InterviewTimer
            isInterviewer={userRole === 'interviewer'}
            onTimerEnd={onEndCall}
            onPhaseChange={() => {}}
            socket={socket}
            roomId={roomId}
          />
          {userRole === 'interviewer' && <InterviewerNotes roomId={roomId} />}
          {onEndCall && (
            <button
              onClick={onEndCall}
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
              setActiveBottomTab('tests')
              setBottomPanelOpen(true)
              setRunNonce(value => value + 1)
            }}
            isRunning={false}
          />
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={code}
              language={language}
              onMount={handleEditorMount}
              height="100%"
            />
          </div>

          {bottomPanelOpen && (
            <div className="h-40 sm:h-48 md:h-56 border-t border-gray-800 flex flex-col flex-shrink-0">
              <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-800 bg-gray-900">
                {['tests', 'output'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveBottomTab(tab)}
                    className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                      activeBottomTab === tab
                        ? 'text-indigo-400 bg-indigo-500/10'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <button
                  onClick={() => setBottomPanelOpen(false)}
                  className="ml-auto p-1 text-gray-600 hover:text-gray-300 rounded transition-colors"
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
              className="flex items-center justify-center gap-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 border-t border-gray-800 bg-gray-900 transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Show Test Panel</span>
              <span className="sm:hidden">Tests</span>
            </button>
          )}
        </div>
      </div>

      <div className="hidden lg:flex w-full lg:w-72 lg:flex-shrink-0 flex-col border-l border-gray-800">
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-800 bg-gray-900">
          <div className="flex gap-0.5">
            {rightTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveRightTab(id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeRightTab === id
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setRightPanelOpen(false)}
            className="p-1.5 text-gray-500 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
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
            className="flex items-center justify-center gap-2 py-2 px-2 text-xs text-gray-500 hover:text-gray-300 border-t border-gray-800 bg-gray-900 transition-colors w-full"
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
    </div>
  )
}
