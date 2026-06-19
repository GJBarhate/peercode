import { memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default memo(function Pagination({ currentPage, totalPages, onPageChange, startItem, endItem, total }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
      {total != null && (
        <p className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
          {startItem}–{endItem} of <span className="font-semibold text-gray-900 dark:text-gray-100">{total}</span>
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let page
          if (totalPages <= 5) page = i + 1
          else if (currentPage <= 3) page = i + 1
          else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
          else page = currentPage - 2 + i
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                page === currentPage
                  ? 'bg-indigo-600 text-white border border-indigo-600'
                  : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {page}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
})
