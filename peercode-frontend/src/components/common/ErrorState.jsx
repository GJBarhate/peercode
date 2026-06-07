import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function ErrorState({ 
  error, 
  onRetry, 
  onGoHome, 
  title = 'Something went wrong',
  showRetry = true,
  showGoHome = true 
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-100 mb-3">{title}</h2>
        
        <p className="text-gray-400 text-sm mb-6">
          {error || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-950"
              aria-label="Retry loading"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try Again
            </button>
          )}
          
          {showGoHome && onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-950"
              aria-label="Go to dashboard"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
