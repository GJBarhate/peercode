import { memo } from 'react'
import { FileSearch, Inbox, AlertCircle } from 'lucide-react'

const ICONS = {
  search: FileSearch,
  inbox: Inbox,
  alert: AlertCircle,
}

export default memo(function EmptyState({
  icon = 'inbox',
  title = 'Nothing here yet',
  description = '',
  action = null,
}) {
  const Icon = (typeof icon === 'string' ? ICONS[icon] : icon) || Inbox
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-150"
        >
          {action.label}
        </button>
      )}
    </div>
  )
})
