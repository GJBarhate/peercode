import { useEffect, useState } from 'react'
import { Play, CheckCircle2, XCircle, AlertCircle, Plus } from 'lucide-react'
import Spinner from '../common/Spinner'
import { runTests, getErrorMessage, solveProblem } from '../../services/api'
import toast from 'react-hot-toast'

export default function TestCaseRunner({ code, language, testCases = [], runNonce = 0, problemSlug, problemId, onRunComplete, externalResults, isRunning: externalIsRunning, onRunningChange }) {
  const [results, setResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [ran, setRan] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('predefined') // 'predefined' or 'custom'
  const [customInput, setCustomInput] = useState('')
  const [customExpected, setCustomExpected] = useState('')

  const running = externalIsRunning !== undefined ? externalIsRunning : isRunning
  const setRunning = externalIsRunning !== undefined ? onRunningChange || (() => {}) : setIsRunning

  useEffect(() => {
    if (externalResults) {
      setResults(externalResults)
      setRan(true)
      setError(null)
    }
  }, [externalResults])

  const handleRun = async (inputData = null) => {
    if (running) return
    if (!code?.trim()) {
      toast.error('Write some code first!')
      return
    }

    setRunning(true)
    setRan(false)
    setError(null)

    try {
      // Use custom input if provided, otherwise use predefined test cases
      let testsToRun = testCases
      if (inputData) {
        testsToRun = [{ input: inputData.input, expectedOutput: inputData.expected }]
      } else if (testCases.length === 0) {
        toast.error('No test cases available for this problem')
        setIsRunning(false)
        return
      }

      const { data } = await runTests({
        code,
        language,
        testCases: testsToRun.map(tc => ({
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || tc.output || ''
        })),
        problemSlug,
        problemId
      })
      
      setResults(data)
      setRan(true)
      onRunComplete?.(data)

      if (data.allPassed) {
        toast.success('🎉 All test cases passed!')
        // Mark problem as solved
        if (problemSlug) {
          try {
            await solveProblem(problemSlug)
          } catch (err) {
            console.warn('Failed to mark problem as solved:', err)
          }
        }
      } else if (data.passedCount > 0) {
        toast(`${data.passedCount}/${data.totalCount} test cases passed`)
      } else {
        toast.error('❌ All test cases failed')
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err, 'Failed to run code')
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setRunning(false)
    }
  }

  const passed = results?.passedCount || 0
  const total = results?.totalCount || 0

  useEffect(() => {
    if (runNonce > 0 && !running) {
      handleRun()
    }
  }, [runNonce, handleRun, running])

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        if (!running) {
          handleRun()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [running, code, language, testCases, handleRun])

  const getStatusColor = () => {
    if (total === 0) return 'bg-gray-700'
    if (passed === total) return 'bg-green-500'
    if (passed === 0) return 'bg-red-500'
    return 'bg-amber-500'
  }

  const renderTopSection = () => {
    if (!ran && testCases.length === 0) {
      return (
        <div className="flex items-center justify-center h-full flex-col gap-3 text-center p-4">
          <AlertCircle className="w-10 h-10 text-gray-600" />
          <p className="text-gray-400 text-sm">No test cases available</p>
          <p className="text-gray-600 text-xs">The problem admin will add test cases soon</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-4 bg-red-900/20 border border-red-700/50 m-4 rounded-lg">
          <p className="text-red-400 text-sm font-medium">Execution Error</p>
          <p className="text-red-300 text-xs mt-2 font-mono">{error}</p>
        </div>
      )
    }

    if (ran && results && total > 0) {
      return (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-sm font-semibold ${passed === total ? 'text-green-400' : passed === 0 ? 'text-red-400' : 'text-amber-400'}`}>
              {passed}/{total} test cases passed
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                passed === total ? 'bg-green-500' : passed === 0 ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: total > 0 ? `${(passed / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )
    }

    if (!ran && testCases.length > 0) {
      return (
        <div className="flex items-center justify-center h-full flex-col gap-3 text-center p-4">
          <AlertCircle className="w-10 h-10 text-gray-600" />
          <p className="text-gray-400 text-sm">Click "Run Tests" to execute test cases</p>
          <p className="text-gray-600 text-xs">{testCases.length} test case{testCases.length > 1 ? 's' : ''} available</p>
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('predefined')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'predefined'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Predefined ({testCases.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Custom Input
          </button>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'custom') {
              handleRun({ input: customInput, expected: customExpected })
            } else {
              handleRun()
            }
          }}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950"
          aria-label={isRunning ? "Tests running..." : "Run tests"}
          title="Run tests (Ctrl+Enter)"
        >
          {isRunning ? (
            <>
              <Spinner size="sm" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Run</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Predefined Tests Tab */}
        {activeTab === 'predefined' && (
          <>
            {renderTopSection()}
            <div className="p-4 space-y-3">
              {results?.results?.map((result, i) => {
                return (
                  <article
                    key={i}
                    className={`bg-gray-900 border rounded-xl overflow-hidden ${
                      result.passed
                        ? 'border-green-700/50'
                        : 'border-red-700/50'
                    }`}
                  >
                    <div className={`flex items-center gap-2 px-4 py-2.5 ${
                      result.passed
                        ? 'bg-green-900/20'
                        : 'bg-red-900/20'
                    }`}>
                      {result.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm font-medium text-gray-200">Test Case {result.index + 1}</span>
                      <span className={`ml-auto text-xs font-semibold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div className="p-4 space-y-2 font-mono text-xs">
                      <div>
                        <span className="text-gray-500">Input: </span>
                        <span className="text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded break-words block mt-1">{result.input || '(empty)'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Expected: </span>
                        <span className="text-green-400 bg-gray-800 px-1.5 py-0.5 rounded break-words block mt-1">{result.expectedOutput || '(empty)'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Got: </span>
                        <span className={`bg-gray-800 px-1.5 py-0.5 rounded break-words block mt-1 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {result.actualOutput || '(empty output)'}
                        </span>
                      </div>
                      {result.error && (
                        <div className="rounded bg-red-950/30 border border-red-800/40 px-2 py-1.5 text-red-300 whitespace-pre-wrap mt-2">
                          {result.error}
                        </div>
                      )}
                      <div className="text-gray-500 flex gap-4 pt-2 border-t border-gray-800">
                        <span>⏱️ {result.executionTime}ms</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}

        {/* Custom Input Tab */}
        {activeTab === 'custom' && (
          <div className="p-4 space-y-4 h-full flex flex-col">
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Input</label>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter test input here..."
                  className="w-full mt-2 p-3 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  rows="5"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expected Output</label>
                <textarea
                  value={customExpected}
                  onChange={(e) => setCustomExpected(e.target.value)}
                  placeholder="Enter expected output here..."
                  className="w-full mt-2 p-3 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  rows="5"
                />
              </div>
            </div>

            {/* Custom test result */}
            {ran && results && activeTab === 'custom' && (
              <div className="border-t border-gray-800 pt-4 mt-4">
                {results.results && results.results[0] && (
                  <div className={`bg-gray-900 border rounded-xl overflow-hidden ${
                    results.results[0].passed ? 'border-green-700/50' : 'border-red-700/50'
                  }`}>
                    <div className={`flex items-center gap-2 px-4 py-2.5 ${
                      results.results[0].passed ? 'bg-green-900/20' : 'bg-red-900/20'
                    }`}>
                      {results.results[0].passed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm font-medium text-gray-200">Test Result</span>
                      <span className={`ml-auto text-xs font-semibold ${results.results[0].passed ? 'text-green-400' : 'text-red-400'}`}>
                        {results.results[0].passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div className="p-4 space-y-2 font-mono text-xs">
                      <div>
                        <span className="text-gray-500">Expected: </span>
                        <span className="text-green-400 bg-gray-800 px-1.5 py-0.5 rounded break-words block mt-1">{results.results[0].expectedOutput || '(empty)'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Got: </span>
                        <span className={`bg-gray-800 px-1.5 py-0.5 rounded break-words block mt-1 ${results.results[0].passed ? 'text-green-400' : 'text-red-400'}`}>
                          {results.results[0].actualOutput || '(empty output)'}
                        </span>
                      </div>
                      {results.results[0].error && (
                        <div className="rounded bg-red-950/30 border border-red-800/40 px-2 py-1.5 text-red-300 whitespace-pre-wrap mt-2">
                          {results.results[0].error}
                        </div>
                      )}
                      <div className="text-gray-500 flex gap-4 pt-2 border-t border-gray-800">
                        <span>⏱️ {results.results[0].executionTime}ms</span>
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                    <p className="text-red-400 text-sm font-medium">Execution Error</p>
                    <p className="text-red-300 text-xs mt-2 font-mono">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
