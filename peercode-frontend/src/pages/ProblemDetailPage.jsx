import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, ChevronLeft } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import ErrorState from '../components/common/ErrorState'
import ProblemPanel from '../components/problems/ProblemPanel'
import CodeEditor from '../components/editor/CodeEditor'
import EditorToolbar from '../components/editor/EditorToolbar'
import TestCaseRunner from '../components/problems/TestCaseRunner'
import Skeleton from '../components/common/Skeleton'
import { getProblem, createRoom, getErrorMessage } from '../services/api'
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
  const [isDragging, setIsDragging] = useState(false)
  const [testPanelHeight, setTestPanelHeight] = useState(280)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const editorRef = useRef(null)
  const containerRef = useRef(null)

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
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const newPos = ((e.clientX - rect.left) / containerRef.current.offsetWidth) * 100
    if (newPos >= 20 && newPos <= 70) setSplitPos(newPos)
  }

  const handleMouseUp = () => setIsDragging(false)

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, splitPos])

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-[#0a0a14]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="w-96 h-96" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-[#0a0a14]">
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
    <div className="h-screen flex flex-col bg-[#0a0a14] overflow-hidden">
      <Navbar />
      
      {/* Problem Toolbar (40px) */}
      <div className="h-10 bg-[#11111f] border-b border-white/[0.06] px-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/problems')}
            className="btn-ghost text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-white/30">/</span>
          <span className="text-sm text-[#f1f1f5] font-medium truncate max-w-xs">{problem?.title}</span>
        </div>
        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="btn-primary text-xs flex items-center gap-2"
        >
          <Users className="w-3.5 h-3.5" />
          {isCreating ? 'Creating...' : 'Practice with Partner'}
        </button>
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
          className={`border-r border-white/[0.06] bg-[#11111f] transition-all duration-200 overflow-hidden flex flex-col ${
            leftPanelCollapsed ? 'w-0' : ''
          }`}
          style={{ width: leftPanelCollapsed ? '0%' : `${splitPos}%` }}
        >
          <ProblemPanel problem={problem} />
        </div>

        {/* Drag Handle */}
        {!leftPanelCollapsed && (
          <div
            onMouseDown={() => setIsDragging(true)}
            className="w-1 bg-transparent hover:bg-[#6d4df2]/30 cursor-col-resize transition-colors"
          />
        )}

        {/* Right Panel - Code + Tests */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Collapse Button */}
          {!leftPanelCollapsed && (
            <button
              onClick={() => setLeftPanelCollapsed(true)}
              className="absolute left-4 top-20 z-10 p-1 hover:bg-white/10 rounded transition-colors"
              title="Collapse problem panel"
            >
              <ChevronLeft className="w-4 h-4 text-white/50" />
            </button>
          )}

          {leftPanelCollapsed && (
            <button
              onClick={() => setLeftPanelCollapsed(false)}
              className="absolute left-0 top-20 z-10 p-1 hover:bg-white/10 rounded transition-colors"
              title="Expand problem panel"
            >
              <ChevronLeft className="w-4 h-4 text-white/50 rotate-180" />
            </button>
          )}

          {/* Editor Section */}
          <div className="flex-1 flex flex-col overflow-hidden border-b border-white/[0.06]">
            <EditorToolbar
              language={language}
              onLanguageChange={handleLanguageChange}
              code={code}
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
            className="bg-[#11111f] overflow-hidden flex flex-col"
            style={{ height: `${testPanelHeight}px` }}
          >
            {/* Test Panel Resize Handle */}
            <div
              onMouseDown={() => setIsDragging(true)}
              className="h-1 bg-transparent hover:bg-[#6d4df2]/30 cursor-row-resize transition-colors"
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
      </div>
    </div>
  )
}
