import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Joyride from 'react-joyride'
import Fuse from 'fuse.js'
import { Search, Filter, X, LayoutGrid, List, CheckCircle, Users, Shuffle } from 'lucide-react'
import Badge from '../components/common/Badge'
import Skeleton from '../components/common/Skeleton'
import Pagination from '../components/common/Pagination'
import { getProblems, getProblemStats, getUserSolvedProblems } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useBookmarks } from '../hooks/useBookmarks'
import { useOnboardingTour, problemsSteps } from '../hooks/useOnboardingTour'
import { Bookmark, BookmarkCheck } from 'lucide-react'

const PROBLEMS_PER_PAGE = 20
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard']
const COMPANIES = ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Netflix', 'Uber', 'Airbnb']

export default function ProblemsPage() {
 const navigate = useNavigate()
 const [searchParams, setSearchParams] = useSearchParams()
 const { isAuthenticated } = useAuth()
 const { run: tourRun, completeTour } = useOnboardingTour('problems')

 const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || 'all')
 const [tagSearch, setTagSearch] = useState(searchParams.get('search') || '')
 const [selectedCompanies, setSelectedCompanies] = useState(
 searchParams.get('companies') ? searchParams.get('companies').split(',') : []
 )
 const [showFilters, setShowFilters] = useState(false)
 const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1)

 const [viewMode, setViewMode] = useState(() => localStorage.getItem('problemsView') || 'table')

 const [problems, setProblems] = useState([])
 const [totalProblems, setTotalProblems] = useState(0)
 const [isLoading, setIsLoading] = useState(true)
 const [error, setError] = useState(null)
 const [solvedSlugs, setSolvedSlugs] = useState(new Set())

 const [problemStats, setProblemStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 })
 const [solvedStats, setSolvedStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 })
 const { toggle: toggleBookmark, isBookmarked } = useBookmarks()

 useEffect(() => {
 const params = {}
 if (difficulty !== 'all') params.difficulty = difficulty
 if (tagSearch) params.search = tagSearch
 if (selectedCompanies.length > 0) params.companies = selectedCompanies.join(',')
 if (currentPage > 1) params.page = String(currentPage)
 setSearchParams(params, { replace: true })
 }, [difficulty, tagSearch, selectedCompanies, currentPage])

 useEffect(() => {
 localStorage.setItem('problemsView', viewMode)
 }, [viewMode])

 useEffect(() => {
 const controller = new AbortController()
 async function load() {
 setIsLoading(true)
 setError(null)
 try {
 const params = {
 page: currentPage,
 limit: PROBLEMS_PER_PAGE,
 ...(difficulty !== 'all' && { difficulty }),
 ...(selectedCompanies.length > 0 && { companies: selectedCompanies.join(',') }),
 ...(tagSearch && { tags: tagSearch }),
 }
 const { data } = await getProblems(params, controller.signal)
 setProblems(data.problems || [])
 setTotalProblems(data.total || 0)
 } catch (err) {
 if (err.name === 'CanceledError' || err.name === 'AbortError') return
 setError(err.response?.data?.message || 'Failed to load problems')
 } finally {
 if (!controller.signal.aborted) setIsLoading(false)
 }
 }
 load()
 return () => controller.abort()
 }, [difficulty, tagSearch, selectedCompanies, currentPage])

 useEffect(() => {
 getProblemStats()
 .then(({ data }) => setProblemStats(data))
 .catch(() => {})
 }, [])

 useEffect(() => {
 if (!isAuthenticated) return
 getUserSolvedProblems()
 .then(({ data }) => {
 setSolvedSlugs(new Set(Array.isArray(data.solvedSlugs) ? data.solvedSlugs : []))
 const solvedList = data.solvedProblems || []
 const counts = { total: 0, easy: 0, medium: 0, hard: 0 }
 for (const p of solvedList) {
 if (p.difficulty === 'easy') counts.easy++
 else if (p.difficulty === 'medium') counts.medium++
 else if (p.difficulty === 'hard') counts.hard++
 counts.total++
 }
 setSolvedStats(counts)
 })
 .catch(() => {})
 }, [isAuthenticated])

 const [showBookmarked, setShowBookmarked] = useState(false)
 const [localSearch, setLocalSearch] = useState('')

 const fuse = useMemo(() => new Fuse(problems, {
 keys: ['title', 'tags', 'slug'],
 threshold: 0.35,
 ignoreLocation: true,
 }), [problems])

 const fuzzyFiltered = useMemo(() => {
 if (!localSearch.trim()) return problems
 return fuse.search(localSearch).map(r => r.item)
 }, [fuse, localSearch, problems])

 const displayedProblems = showBookmarked
 ? fuzzyFiltered.filter(p => isBookmarked(p.slug))
 : fuzzyFiltered
 const totalPages = Math.ceil(totalProblems / PROBLEMS_PER_PAGE)
 const startItem = totalProblems === 0 ? 0 : (currentPage - 1) * PROBLEMS_PER_PAGE + 1
 const endItem = Math.min(currentPage * PROBLEMS_PER_PAGE, totalProblems)

 const toggleCompany = (c) => {
 setSelectedCompanies(prev =>
 prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
 )
 }

 const handlePractice = (problem) => {
 navigate(`/problems/${problem.slug}`)
 }

 const activeFilterCount = (difficulty !== 'all' ? 1 : 0) + selectedCompanies.length + (tagSearch ? 1 : 0)

 const easyPercent = problemStats.total > 0 ? (problemStats.easy / problemStats.total) * 100 : 0
 const mediumPercent = problemStats.total > 0 ? (problemStats.medium / problemStats.total) * 100 : 0
 const hardPercent = problemStats.total > 0 ? (problemStats.hard / problemStats.total) * 100 : 0

 return (
 <div className="min-h-screen bg-bg-base">
 <Helmet>
 <title>Problems — PeerCode</title>
 <meta name="description" content="Browse and practice algorithmic coding problems. Filter by difficulty, tags, and companies." />
 </Helmet>
 <Joyride
 steps={problemsSteps}
 run={tourRun}
 continuous
 showSkipButton
 showProgress
 callback={(data) => { if (data.status === 'finished' || data.status === 'skipped') completeTour() }}
 styles={{ options: { zIndex: 10000, primaryColor: '#6d4df2', backgroundColor: '#1a1a2e', textColor: '#e2e8f0', arrowColor: '#1a1a2e' }, tooltip: { borderRadius: 12, padding: '20px' } }}
 />
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">

 <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
 <div>
 <h1 className="text-3xl font-bold text-text-primary mb-2">Problems</h1>
 <p className="text-text-muted">Browse and practice algorithmic problems</p>
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 <button
 onClick={() => setShowBookmarked(v => !v)}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${showBookmarked ? 'text-amber-900 bg-amber-400 hover:bg-amber-300' : 'text-text-muted hover:text-white bg-bg-surface/5 border border-border-default hover:border-amber-400/50'}`}
 >
 {showBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
 {showBookmarked ? 'All Problems' : 'Bookmarked'}
 </button>
 {problems.length > 0 && (
 <button
 onClick={() => {
 const unsolvedProblems = problems.filter(p => !solvedSlugs.has(p.slug))
 const pool = unsolvedProblems.length > 0 ? unsolvedProblems : problems
 const pick = pool[Math.floor(Math.random() * pool.length)]
 if (pick?.slug) navigate(`/problems/${pick.slug}`)
 }}
 className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all active:scale-[0.98]"
 >
 <Shuffle className="w-4 h-4" />
 Random
 </button>
 )}
 </div>
 </div>

 {problemStats.total > 0 && (
 <div className="mb-6 bg-bg-surface border border-border-default rounded-xl p-5">
 <div className="flex items-center gap-4 flex-wrap">
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
 <CheckCircle className="w-3.5 h-3.5" />
 {solvedStats.easy} / {problemStats.easy} Easy
 </span>
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
 <CheckCircle className="w-3.5 h-3.5" />
 {solvedStats.medium} / {problemStats.medium} Medium
 </span>
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
 <CheckCircle className="w-3.5 h-3.5" />
 {solvedStats.hard} / {problemStats.hard} Hard
 </span>
 <span className="text-sm text-text-muted ml-auto">
 {solvedStats.total} / {problemStats.total} solved
 </span>
 </div>
 <div className="mt-3 h-2 bg-bg-overlay rounded-full overflow-hidden flex">
 <div
 className="h-full bg-green-500 transition-all duration-500"
 style={{ width: `${(solvedStats.easy / problemStats.total) * 100}%` }}
 />
 <div
 className="h-full bg-amber-500 transition-all duration-500"
 style={{ width: `${(solvedStats.medium / problemStats.total) * 100}%` }}
 />
 <div
 className="h-full bg-red-500 transition-all duration-500"
 style={{ width: `${(solvedStats.hard / problemStats.total) * 100}%` }}
 />
 </div>
 <div className="mt-2 h-1 bg-bg-overlay rounded-full overflow-hidden flex">
 <div
 className="h-full bg-green-500/40"
 style={{ width: `${easyPercent}%` }}
 />
 <div
 className="h-full bg-amber-500/40"
 style={{ width: `${mediumPercent}%` }}
 />
 <div
 className="h-full bg-red-500/40"
 style={{ width: `${hardPercent}%` }}
 />
 </div>
 </div>
 )}

 <div data-tour="problems-filters" className="mb-6 space-y-4">
 <div className="flex items-center gap-3 flex-wrap">
 <div className="flex gap-1 bg-bg-surface border border-border-default rounded-xl p-1" role="radiogroup" aria-label="Filter by difficulty">
 {DIFFICULTIES.map(d => (
 <button
 key={d}
 onClick={() => { setDifficulty(d); setCurrentPage(1) }}
 role="radio"
 aria-checked={difficulty === d}
 className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950 ${
 difficulty === d
 ? d === 'easy' ? 'bg-green-700 text-white focus:ring-green-500'
 : d === 'medium' ? 'bg-amber-700 text-white focus:ring-amber-500'
 : d === 'hard' ? 'bg-red-700 text-white focus:ring-red-500'
 : 'bg-indigo-600 text-white focus:ring-indigo-500'
 : 'text-text-muted hover:text-text-secondary'
 }`}
 >
 {d === 'all' ? 'All' : d}
 </button>
 ))}
 </div>

 <div className="relative flex-1 max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
 <input
 type="text"
 value={localSearch}
 onChange={e => setLocalSearch(e.target.value)}
 placeholder="Fuzzy search problems..."
 data-search-input
 aria-label="Fuzzy search problems"
 className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-border-default rounded-xl text-sm text-text-secondary placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950"
 />
 {localSearch && (
 <button
 onClick={() => setLocalSearch('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
 aria-label="Clear search"
 >
 <X className="w-4 h-4" />
 </button>
 )}
 </div>

 <div className="relative flex-1 max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
 <input
 type="text"
 value={tagSearch}
 onChange={e => { setTagSearch(e.target.value); setCurrentPage(1) }}
 placeholder="Filter by tag..."
 aria-label="Search problems by tag"
 className="w-full pl-9 pr-4 py-2 bg-bg-surface border border-border-default rounded-xl text-sm text-text-secondary placeholder-gray-500 dark:placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950"
 />
 {tagSearch && (
 <button
 onClick={() => { setTagSearch(''); setCurrentPage(1) }}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
 aria-label="Clear tag search"
 >
 <X className="w-4 h-4" />
 </button>
 )}
 </div>

 <button
 onClick={() => setShowFilters(v => !v)}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950 ${
 showFilters || activeFilterCount > 0
 ? 'bg-indigo-600 border-indigo-500 text-white focus:ring-indigo-500'
 : 'bg-bg-surface border-border-default text-text-muted hover:text-text-secondary focus:ring-indigo-500'
 }`}
 aria-label={`Toggle advanced filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
 >
 <Filter className="w-4 h-4" />
 Filters
 {activeFilterCount > 0 && (
 <span className="ml-1 bg-bg-surface/20 text-white text-xs px-1.5 rounded-full">{activeFilterCount}</span>
 )}
 </button>

 <div className="flex items-center gap-1 bg-bg-surface border border-border-default rounded-xl p-1 ml-auto" role="radiogroup" aria-label="View mode">
 <button
 onClick={() => setViewMode('table')}
 role="radio"
 aria-checked={viewMode === 'table'}
 className={`p-2 rounded-lg transition-colors ${
 viewMode === 'table'
 ? 'bg-indigo-600 text-white'
 : 'text-text-muted hover:text-text-secondary'
 }`}
 aria-label="Table view"
 >
 <List className="w-4 h-4" />
 </button>
 <button
 onClick={() => setViewMode('grid')}
 role="radio"
 aria-checked={viewMode === 'grid'}
 className={`p-2 rounded-lg transition-colors ${
 viewMode === 'grid'
 ? 'bg-indigo-600 text-white'
 : 'text-text-muted hover:text-text-secondary'
 }`}
 aria-label="Card view"
 >
 <LayoutGrid className="w-4 h-4" />
 </button>
 </div>
 </div>

 {showFilters && (
 <div className="bg-bg-surface border border-border-default rounded-xl p-4">
 <div>
 <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Companies</p>
 <div className="flex flex-wrap gap-2">
 {COMPANIES.map(c => (
 <button
 key={c}
 onClick={() => toggleCompany(c)}
 className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
 selectedCompanies.includes(c)
 ? 'bg-indigo-600 border-indigo-500 text-white'
 : 'bg-bg-elevated border-border-strong text-text-muted hover:text-text-secondary'
 }`}
 >
 {c}
 </button>
 ))}
 {selectedCompanies.length > 0 && (
 <button
 onClick={() => setSelectedCompanies([])}
 className="px-3 py-1 rounded-lg text-xs font-medium text-red-400 hover:text-red-300"
 >
 Clear
 </button>
 )}
 </div>
 </div>
 </div>
 )}
 </div>

 {isLoading ? (
 viewMode === 'table' ? (
 <div data-tour="problems-list" className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
 <table className="w-full">
 <thead>
 <tr className="border-b border-border-default">
 {['#', 'Title', 'Difficulty', 'Tags', 'Acceptance', 'Solved'].map(h => (
 <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {Array.from({ length: 10 }).map((_, i) => (
 <tr key={i} className="border-b border-border-default/50">
 {Array.from({ length: 6 }).map((_, j) => (
 <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-3">
 <Skeleton className="h-5 w-3/4" />
 <div className="flex gap-2">
 <Skeleton className="h-5 w-16" />
 <Skeleton className="h-5 w-20" />
 </div>
 <Skeleton className="h-4 w-1/2" />
 <Skeleton className="h-9 w-full" />
 </div>
 ))}
 </div>
 )
 ) : error ? (
 <div className="text-center py-16">
 <p className="text-red-400 mb-4">{error}</p>
 <button onClick={() => { setError(null); setCurrentPage(1) }} className="btn-secondary text-sm">
 Retry
 </button>
 </div>
 ) : problems.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 gap-3">
 <Search className="w-10 h-10 text-text-muted" />
 <p className="text-text-muted">No problems found matching your filters.</p>
 <button
 onClick={() => { setDifficulty('all'); setTagSearch(''); setSelectedCompanies([]); setCurrentPage(1) }}
 className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-elevated text-text-secondary hover:bg-bg-overlay transition-colors"
 >
 Clear filters
 </button>
 </div>
 ) : viewMode === 'table' ? (
 <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
 <table className="w-full">
 <thead>
 <tr className="border-b border-border-default">
 <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-12">#</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Title</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-24">Difficulty</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Tags</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider w-28">Acceptance</th>
 <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase tracking-wider w-16">Solved</th>
 </tr>
 </thead>
 <tbody>
 {displayedProblems.map((problem, idx) => {
 const globalIndex = (currentPage - 1) * PROBLEMS_PER_PAGE + idx + 1
 const isSolved = solvedSlugs.has(problem.slug)
 const diffColor = problem.difficulty?.toLowerCase() === 'easy' ? 'hover:border-l-emerald-500'
 : problem.difficulty?.toLowerCase() === 'hard' ? 'hover:border-l-red-500'
 : 'hover:border-l-amber-500'
 return (
 <tr
 key={problem._id || problem.id}
 className={`group border-b border-border-default/50 border-l-2 border-l-transparent hover:border-l-2 ${diffColor} hover:bg-indigo-50/30 dark:hover:bg-indigo-500/[0.04] transition-all duration-150 ${
 isSolved ? 'dark:bg-emerald-500/[0.02]' : idx % 2 === 0 ? 'bg-bg-base' : 'bg-bg-surface'
 }`}
 >
 <td className="px-4 py-3 text-sm text-text-muted">{globalIndex}</td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <button
 onClick={() => toggleBookmark(problem.slug)}
 className={`flex-shrink-0 transition-colors opacity-0 group-hover:opacity-100 ${isBookmarked(problem.slug) ? 'text-amber-400 opacity-100' : 'text-text-muted hover:text-amber-400'}`}
 title={isBookmarked(problem.slug) ? 'Remove bookmark' : 'Bookmark'}
 >
 {isBookmarked(problem.slug) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
 </button>
 <Link
 to={`/problems/${problem.slug}`}
 className="font-medium text-text-primary hover:text-indigo-400 transition-colors"
 >
 {problem.title}
 </Link>
 </div>
 </td>
 <td className="px-4 py-3">
 <Badge variant={problem.difficulty?.toLowerCase() || 'default'}>
 {problem.difficulty}
 </Badge>
 </td>
 <td className="px-4 py-3">
 <div className="flex flex-wrap gap-1">
 {(problem.tags || []).slice(0, 3).map(t => (
 <span key={t} className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-800/50">
 {t}
 </span>
 ))}
 </div>
 </td>
 <td className="px-4 py-3 text-sm text-text-muted">
 {problem.acceptanceRate != null ? `${problem.acceptanceRate}%` : 'N/A'}
 </td>
 <td className="px-4 py-3 text-center">
 {isSolved ? (
 <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
 ) : (
 <span className="text-text-muted">—</span>
 )}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {displayedProblems.map(problem => {
 const isSolved = solvedSlugs.has(problem.slug)
 return (
 <div
 key={problem._id || problem.id}
 className={`group bg-bg-surface border rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-default ${
 problem.difficulty?.toLowerCase() === 'easy'
 ? 'border-border-default hover:border-emerald-400/40 dark:hover:border-emerald-500/30 hover:shadow-emerald-500/10'
 : problem.difficulty?.toLowerCase() === 'hard'
 ? 'border-border-default hover:border-red-400/40 dark:hover:border-red-500/30 hover:shadow-red-500/10'
 : 'border-border-default hover:border-amber-400/40 dark:hover:border-amber-500/30 hover:shadow-amber-500/10'
 }`}
 >
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0 flex-1">
 <Link
 to={`/problems/${problem.slug}`}
 className="font-semibold text-text-primary hover:text-indigo-400 transition-colors leading-tight"
 >
 {problem.title}
 </Link>
 {isSolved && (
 <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-400">
 <CheckCircle className="w-3 h-3" />
 Solved
 </span>
 )}
 </div>
 <div className="flex items-center gap-1.5 flex-shrink-0">
 <button
 onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(problem.slug) }}
 className={`p-1 rounded transition-colors ${isBookmarked(problem.slug) ? 'text-amber-400' : 'text-text-muted hover:text-amber-400'}`}
 title={isBookmarked(problem.slug) ? 'Remove bookmark' : 'Bookmark'}
 >
 {isBookmarked(problem.slug) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
 </button>
 <Badge variant={problem.difficulty?.toLowerCase() || 'default'}>
 {problem.difficulty}
 </Badge>
 </div>
 </div>

 <div className="flex flex-wrap gap-1.5">
 {(problem.tags || []).slice(0, 3).map(t => (
 <span key={t} className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-800/50">
 {t}
 </span>
 ))}
 </div>

 <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
 {problem.acceptanceRate != null && (
 <div className="flex items-center gap-1.5">
 <CheckCircle className="w-3 h-3" />
 <span>{problem.acceptanceRate}% accepted</span>
 </div>
 )}
 {problem.solvedCount > 0 && (
 <div className="flex items-center gap-1.5">
 <Users className="w-3 h-3" />
 <span>{problem.solvedCount} solved</span>
 </div>
 )}
 </div>

 <button
 onClick={() => handlePractice(problem)}
 className="mt-auto w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
 >
 Solve Problem
 </button>
 </div>
 )
 })}
 </div>
 )}

 <Pagination
 currentPage={currentPage}
 totalPages={totalPages}
 onPageChange={setCurrentPage}
 startItem={startItem}
 endItem={endItem}
 total={totalProblems}
 />
 </div>
 </div>
 )
}
