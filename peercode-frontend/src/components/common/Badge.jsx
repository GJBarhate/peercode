import { memo } from 'react'
import { twMerge } from 'tailwind-merge'

const variants = {
 easy: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700',
 medium: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
 hard: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700',
 default: 'bg-bg-elevated text-text-secondary border border-border-strong',
 indigo: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700',
 green: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700',
 amber: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
 red: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700',
 blue: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
}

export default memo(function Badge({ children, variant = 'default', className = '' }) {
 return (
 <span className={twMerge(
 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
 variants[variant] || variants.default,
 className
 )}>
 {children}
 </span>
 )
})
