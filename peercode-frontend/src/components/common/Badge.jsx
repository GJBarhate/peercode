import { twMerge } from 'tailwind-merge'

const variants = {
  easy: 'bg-green-900 text-green-400 border border-green-700',
  medium: 'bg-amber-900 text-amber-400 border border-amber-700',
  hard: 'bg-red-900 text-red-400 border border-red-700',
  default: 'bg-gray-800 text-gray-300 border border-gray-700',
  indigo: 'bg-indigo-900 text-indigo-300 border border-indigo-700',
  green: 'bg-green-900 text-green-400 border border-green-700',
  amber: 'bg-amber-900 text-amber-400 border border-amber-700',
  red: 'bg-red-900 text-red-400 border border-red-700',
  blue: 'bg-blue-900 text-blue-400 border border-blue-700'
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={twMerge(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      variants[variant] || variants.default,
      className
    )}>
      {children}
    </span>
  )
}
