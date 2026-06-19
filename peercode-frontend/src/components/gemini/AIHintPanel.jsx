import { useState } from 'react'
import { Lightbulb, Code2, RefreshCw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../common/Spinner'
import { useGemini } from '../../hooks/useGemini'
import { useGeminiContext } from '../../context/GeminiContext'

export default function AIHintPanel({ code, language, problem }) {
  const { fetchHint, fetchAnalysis, isLoadingHint, isLoadingAnalysis, hint, analysis } = useGemini()
  const { hasPersonalKey } = useGeminiContext()
  const [analysisExpanded, setAnalysisExpanded] = useState(false)

  const handleGetHint = () => {
    if (!problem?.description && !problem?.title) {
      toast.error('Please select a problem first')
      return
    }
    fetchHint({
      code: code || '',
      problemDescription: problem?.description || problem?.title || '',
      language
    })
  }

  const handleAnalyze = () => {
    if (!code?.trim()) {
      toast.error('Please write some code first')
      return
    }
    if (!problem?.description && !problem?.title) {
      toast.error('Please select a problem first')
      return
    }
    fetchAnalysis({
      code: code || '',
      language,
      problemDescription: problem?.description || problem?.title || ''
    })
    setAnalysisExpanded(true)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-gray-200">AI Assistant</span>
          {hasPersonalKey && (
            <span className="ml-auto text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-800/50">Personal Key</span>
          )}
        </div>
        <p className="text-xs text-gray-500">Powered by Gemini AI</p>
      </div>

      <div className="p-4 space-y-3">
        <button
          onClick={handleGetHint}
          disabled={isLoadingHint}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingHint ? <Spinner size="sm" /> : <Lightbulb className="w-4 h-4" />}
          {isLoadingHint ? 'Getting hint...' : 'Get a Hint'}
        </button>

        <button
          onClick={handleAnalyze}
          disabled={isLoadingAnalysis || !code?.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingAnalysis ? <Spinner size="sm" /> : <Code2 className="w-4 h-4" />}
          {isLoadingAnalysis ? 'Analyzing...' : 'Analyze My Code'}
        </button>
      </div>

      {hint && (
        <div className="mx-4 mb-4 p-4 bg-indigo-900/20 border border-indigo-800/50 rounded-xl max-h-64 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-indigo-400">Hint</span>
            <button
              onClick={handleGetHint}
              className="ml-auto p-1 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
              title="Get another hint"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1">{hint}</p>
        </div>
      )}

      {analysis && (
        <div className="mx-4 mb-4 border border-gray-700 rounded-xl overflow-hidden max-h-full flex flex-col">
          <button
            onClick={() => setAnalysisExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-gray-200">Code Analysis</span>
            </div>
            {analysisExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {analysisExpanded && (
            <div className="p-4 space-y-4 bg-gray-900 overflow-y-auto max-h-80">
              {analysis.timeComplexity && (
                <div className="pb-3 border-b border-gray-800">
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">⏱️ Time Complexity</span>
                  <p className="text-sm text-amber-400 font-mono mt-1.5 bg-gray-800/50 p-2 rounded">{analysis.timeComplexity}</p>
                </div>
              )}
              {analysis.spaceComplexity && (
                <div className="pb-3 border-b border-gray-800">
                  <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">💾 Space Complexity</span>
                  <p className="text-sm text-blue-400 font-mono mt-1.5 bg-gray-800/50 p-2 rounded">{analysis.spaceComplexity}</p>
                </div>
              )}
              {analysis.feedback && (
                <div>
                  <span className="text-xs font-semibold text-green-500 uppercase tracking-wider">📋 Detailed Feedback</span>
                  <p className="text-sm text-gray-300 mt-2 leading-relaxed whitespace-pre-wrap">{analysis.feedback}</p>
                </div>
              )}
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div className="pt-2 border-t border-gray-800">
                  <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">💡 Improvements</span>
                  <ul className="mt-2 space-y-2">
                    {(Array.isArray(analysis.suggestions) ? analysis.suggestions : [analysis.suggestions]).map((s, i) => (
                      <li key={i} className="text-sm text-gray-400 flex gap-2 bg-indigo-900/20 p-2 rounded border border-indigo-800/30">
                        <span className="text-indigo-400 flex-shrink-0 font-semibold">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
