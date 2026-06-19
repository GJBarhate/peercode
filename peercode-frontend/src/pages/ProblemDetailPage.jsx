import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, ChevronLeft, Lightbulb, Code2, X, Clock, Cpu, Flag } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import ErrorState from '../components/common/ErrorState'
import ProblemPanel from '../components/problems/ProblemPanel'
import CodeEditor from '../components/editor/CodeEditor'
import EditorToolbar from '../components/editor/EditorToolbar'
import TestCaseRunner from '../components/problems/TestCaseRunner'
import Skeleton from '../components/common/Skeleton'
import ReportProblemModal from '../components/problems/ReportProblemModal'
import { getProblem, createRoom, getErrorMessage } from '../services/api'
import { useGemini } from '../hooks/useGemini'
import { STARTER_CODE } from '../utils/codeTemplates'
import toast from 'react-hot-toast'

export default function ProblemDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [problem, setProblem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(STARTER_CODE.javascript)
  const [isCreating, setIsCreating] = useState(false)
  const [splitPos, setSplitPos] = useState(40) // Left panel width %
  const [isDraggingH, setIsDraggingH] = useState(false)  // horizontal
  const [isDraggingV, setIsDraggingV] = useState(false)  // vertical (test panel)
  const [testPanelHeight, setTestPanelHeight] = useState(280)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [aiMode, setAiMode] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const editorRef = useRef(null)
  const containerRef = useRef(null)
  const { isLoadingHint, isLoadingAnalysis, hint, analysis, fetchHint, fetchAnalysis } = useGemini()

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await getProblem(slug)
      setProblem(data)
      setCode(data.starterCode?.[language] || data.stubs?.[language] || STARTER_CODE[language] || '// Start coding here\n')
    } catch (err) {
      setError(getErrorMessage(err, 'Problem not found'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [slug])

  useEffect(() => {
    if (problem) {
      setCode(
        problem?.starterCode?.[language] ||
        problem?.stubs?.[language] ||
        STARTER_CODE[language] ||
        '// Start coding here\n'
      )
    }
  }, [problem, language])

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setCode(
      problem?.starterCode?.[lang] ||
      problem?.stubs?.[lang] ||
      STARTER_CODE[lang] ||
      '// Start coding here\n'
    )
  }

  const handleCreateRoom = async () => {
    setIsCreating(true)
    try {
      toast.loading('Creating room...')
      const { data } = await createRoom({ problemSlug: slug })
      toast.success('Room created!')
      navigate(`/room/${data.roomId}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create room'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleMouseMove = (e) => {
    if (isDraggingH && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const newPos = ((e.clientX - rect.left) / containerRef.current.offsetWidth) * 100
      if (newPos >= 20 && newPos <= 70) setSplitPos(newPos)
    }
    if (isDraggingV) {
      const rightPanel = containerRef.current?.querySelector('.test-panel-container')
      if (!rightPanel) return
      const rect = rightPanel.parentElement.getBoundingClientRect()
      const fromBottom = rect.bottom - e.clientY
      if (fromBottom >= 120 && fromBottom <= 600) setTestPanelHeight(fromBottom)
    }
  }

  const handleMouseUp = () => { setIsDraggingH(false); setIsDraggingV(false) }

  useEffect(() => {
    if (isDraggingH || isDraggingV) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDraggingH, isDraggingV, splitPos])

  const handleGetHint = async () => {
    setAiMode('hint')
    await fetchHint({ code, problemDescription: problem?.description, language })
  }

  const handleAnalyze = async () => {
    setAiMode('analysis')
    await fetchAnalysis({ code, language, problemDescription: problem?.description })
  }

  const handleCloseAi = () => {
    setAiMode(null)
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0a0a14]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="w-96 h-96" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#0a0a14]">
        <Navbar />
        <ErrorState
          error={error}
          title="Failed to Load Problem"
          onRetry={load}
          onGoHome={() => navigate('/problems')}
        />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0a0a14] overflow-hidden">
      <Helmet>
        <title>{problem?.title || 'Problem'} | PeerCode</title>
        <meta name="description" content="Solve this coding problem on PeerCode" />
      </Helmet>
      <Navbar />
      
      {/* Problem Toolbar (40px) */}
      <div className="h-14 bg-white dark:bg-[#11111f] border-b border-gray-200 dark:border-white/[0.06] px-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/problems')}
            className="btn-ghost text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-gray-900/30 dark:text-white/30">/</span>
          <span className="text-sm text-gray-900 dark:text-[#f1f1f5] font-medium truncate max-w-xs">{problem?.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Users className="w-3.5 h-3.5" />
            {isCreating ? 'Creating...' : 'Open Practice Room'}
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5"
            title="Report a problem with this question"
          >
            <Flag className="w-3.5 h-3.5" />
            Report
          </button>
        </div>
      </div>

      {/* Main Content (3-panel layout) */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Left Panel - Problem Description */}
        <div 
          className={`border-r border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#11111f] transition-all duration-200 overflow-hidden flex flex-col ${
            leftPanelCollapsed ? 'w-0' : ''
          }`}
          style={{ width: leftPanelCollapsed ? '0%' : `${splitPos}%` }}
        >
          <ProblemPanel problem={problem} />
        </div>

        {/* Horizontal Drag Handle */}
        {!leftPanelCollapsed && (
          <div
            onMouseDown={() => setIsDraggingH(true)}
            className="w-1.5 bg-transparent hover:bg-[#6d4df2]/40 cursor-col-resize transition-colors flex-shrink-0"
          />
        )}

        {/* Right Panel - Code + Tests */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code + Test Section */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Collapse Button */}
            {!leftPanelCollapsed && (
              <button
                onClick={() => setLeftPanelCollapsed(true)}
                className="absolute left-4 top-20 z-10 p-1 hover:bg-gray-900/10 dark:hover:bg-white/10 rounded transition-colors"
                title="Collapse problem panel"
              >
                <ChevronLeft className="w-4 h-4 text-gray-900/50 dark:text-white/50" />
              </button>
            )}

            {leftPanelCollapsed && (
              <button
                onClick={() => setLeftPanelCollapsed(false)}
                className="absolute left-0 top-20 z-10 p-1 hover:bg-gray-900/10 dark:hover:bg-white/10 rounded transition-colors"
                title="Expand problem panel"
              >
                <ChevronLeft className="w-4 h-4 text-gray-900/50 dark:text-white/50 rotate-180" />
              </button>
            )}

            {/* Editor Section */}
            <div className="flex-1 flex flex-col overflow-hidden border-b border-gray-200 dark:border-white/[0.06]">
              <EditorToolbar
                language={language}
                onLanguageChange={handleLanguageChange}
                code={code}
                onGetHint={handleGetHint}
                onAnalyze={handleAnalyze}
                isLoadingHint={isLoadingHint}
                isLoadingAnalysis={isLoadingAnalysis}
              />

              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  value={code}
                  language={language}
                  onChange={setCode}
                  onMount={editor => { editorRef.current = editor }}
                  height="100%"
                />
              </div>
            </div>

            {/* Test Panel Section */}
            <div
              className="test-panel-container bg-white dark:bg-[#11111f] overflow-hidden flex flex-col flex-shrink-0"
              style={{ height: `${testPanelHeight}px` }}
            >
              <div
                onMouseDown={() => setIsDraggingV(true)}
                className="h-1.5 bg-transparent hover:bg-[#6d4df2]/40 cursor-row-resize transition-colors flex-shrink-0"
              />
              <TestCaseRunner
                code={code}
                language={language}
                testCases={problem?.testCases || problem?.examples?.slice(0, 3).map(e => ({
                  input: e.input,
                  expectedOutput: e.output
                })) || []}
                problemSlug={slug}
                problemId={problem?._id}
              />
            </div>
          </div>

          {/* AI Sidebar */}
          {aiMode && (
            <div className="w-96 border-l border-gray-200 dark:border-white/[0.06] bg-gray-900 flex flex-col overflow-hidden flex-shrink-0">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  {aiMode === 'hint' ? (
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-purple-400" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-200">
                    {aiMode === 'hint' ? 'AI Hint' : 'AI Analysis'}
                  </span>
                </div>
                <button onClick={handleCloseAi} className="p-1 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Loading */}
                {(isLoadingHint || isLoadingAnalysis) && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                    <p className="text-sm text-gray-400">Generating {aiMode === 'hint' ? 'hint' : 'analysis'}...</p>
                  </div>
                )}

                {/* Hint Result */}
                {aiMode === 'hint' && hint && !isLoadingHint && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <p className="text-xs text-amber-300/80">
                        Review the hint below to guide your approach without revealing the full solution.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10">
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{hint}</p>
                    </div>
                    <button
                      onClick={handleGetHint}
                      disabled={isLoadingHint}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Get Another Hint
                    </button>
                  </div>
                )}

                {/* Analysis Result */}
                {aiMode === 'analysis' && analysis && !isLoadingAnalysis && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Code2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <p className="text-xs text-purple-300/80">
                        Detailed analysis of your code including complexity and suggestions.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[10px] text-indigo-400 uppercase font-semibold tracking-wider">Time</span>
                        </div>
                        <p className="text-sm text-gray-200 font-mono">{analysis.timeComplexity || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 uppercase font-semibold tracking-wider">Space</span>
                        </div>
                        <p className="text-sm text-gray-200 font-mono">{analysis.spaceComplexity || 'N/A'}</p>
                      </div>
                    </div>

                    {analysis.feedback && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Feedback</h4>
                        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                          <p className="text-sm text-gray-300 leading-relaxed">{analysis.feedback}</p>
                        </div>
                      </div>
                    )}

                    {analysis.suggestions?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Suggestions</h4>
                        <ul className="space-y-1.5">
                          {analysis.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[10px] font-bold text-emerald-400">{i + 1}</span>
                              </span>
                              <span className="text-sm text-gray-300">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={handleAnalyze}
                      disabled={isLoadingAnalysis}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Code2 className="w-4 h-4" />
                      Analyze Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <ReportProblemModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        problemId={problem?._id}
        problemTitle={problem?.title}
      />
    </div>
  )
}
