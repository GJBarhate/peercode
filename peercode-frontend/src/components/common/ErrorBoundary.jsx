import { Component } from 'react'
import { AlertOctagon, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertOctagon className="w-10 h-10 text-red-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Something went wrong</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <p className="text-gray-500 text-xs mb-8 font-mono">
              {this.state.error?.stack?.split('\n')[1]?.trim()}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-gray-900 dark:text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
