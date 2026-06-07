import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function TestResultsPanel({ results, isLoading }) {
  const [expandedIndex, setExpandedIndex] = useState(null)

  if (!results) return null

  const { passedCount, totalCount, results: testResults } = results

  return (
    <div className="mt-6 border border-gray-800 rounded-xl overflow-hidden bg-gray-900/50">
      {/* Header Summary */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-200">Test Results</h3>
          <span className={`text-sm font-medium ${passedCount === totalCount ? 'text-green-400' : 'text-red-400'}`}>
            {passedCount} / {totalCount} passed
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${passedCount === totalCount ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${(passedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Test Cases List */}
      <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
        {testResults.map((result) => (
          <div
            key={result.index}
            className={`${result.passed ? 'bg-green-900/10' : 'bg-red-900/10'}`}
          >
            {/* Test Case Header */}
            <button
              onClick={() => setExpandedIndex(expandedIndex === result.index ? null : result.index)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {result.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-200">
                    Test Case {result.index + 1}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {result.passed ? 'Passed' : 'Failed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {result.executionTime}ms
                </div>
                {expandedIndex === result.index ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedIndex === result.index && (
              <div className="px-4 py-3 bg-gray-800/30 space-y-3 border-t border-gray-700">
                {/* Input */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Input
                  </p>
                  <pre className="bg-gray-900 p-2 rounded text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-words">
                    {result.input}
                  </pre>
                </div>

                {/* Expected Output */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Expected Output
                  </p>
                  <pre className="bg-green-900/20 border border-green-800/50 p-2 rounded text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-words">
                    {result.expectedOutput}
                  </pre>
                </div>

                {/* Actual Output */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Actual Output
                  </p>
                  <pre className={`border p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words ${
                    result.passed
                      ? 'bg-green-900/20 border-green-800/50 text-green-400'
                      : 'bg-red-900/20 border-red-800/50 text-red-400'
                  }`}>
                    {result.actualOutput || '(empty)'}
                  </pre>
                </div>

                {/* Error (if any) */}
                {result.error && (
                  <div>
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">
                      Error
                    </p>
                    <pre className="bg-red-900/20 border border-red-800/50 p-2 rounded text-xs text-red-400 overflow-x-auto whitespace-pre-wrap break-words">
                      {result.error}
                    </pre>
                  </div>
                )}

                {/* Execution Time */}
                <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-700">
                  <Clock className="w-3 h-3" />
                  <span>Execution time: {result.executionTime}ms</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
