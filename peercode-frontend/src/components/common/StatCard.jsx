const TONES = {
 indigo: 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
 green: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
 amber: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
 purple: 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
 pink: 'text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20',
 red: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
 blue: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
}

import { memo } from 'react'

export default memo(function StatCard({ label, value, detail, icon: Icon, tone = 'indigo' }) {
 return (
 <div className="group bg-bg-surface border border-border-default rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200 cursor-default">
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0">
 <p className="text-xs font-semibold uppercase tracking-wider text-text-muted truncate">{label}</p>
 <p className="mt-2 text-3xl font-bold text-text-primary tabular-nums">{value}</p>
 {detail && <p className="mt-1 text-xs text-text-muted truncate">{detail}</p>}
 </div>
 {Icon && (
 <div className={`shrink-0 p-2.5 rounded-lg border transition-transform duration-200 group-hover:scale-110 ${TONES[tone] || TONES.indigo}`}>
 <Icon className="w-5 h-5" />
 </div>
 )}
 </div>
 </div>
 )
})
