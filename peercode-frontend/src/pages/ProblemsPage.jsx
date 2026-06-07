import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Search, Filter, X, LayoutGrid, List, CheckCircle, ArrowLeft, ArrowRight, Users } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Badge from '../components/common/Badge'
import Skeleton from '../components/common/Skeleton'
import { getProblems, getProblemStats, getUserSolvedProblems, createRoom, getErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const PROBLEMS_PER_PAGE = 20
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard']
const COMPANIES = ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Netflix', 'Uber', 'Airbnb']

export default function ProblemsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

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
        const { data } = await getProblems(params)
        setProblems(data.problems || [])
        setTotalProblems(data.total || 0)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load problems')
      } finally {
        setIsLoading(false)
      }
    }
    load()
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
        setSolvedSlugs(new Set(data.solvedSlugs || []))
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

  const totalPages = Math.ceil(totalProblems / PROBLEMS_PER_PAGE)
  const startItem = totalProblems === 0 ? 0 : (currentPage - 1) * PROBLEMS_PER_PAGE + 1
  const endItem = Math.min(currentPage * PROBLEMS_PER_PAGE, totalProblems)

  const toggleCompany = (c) => {
    setSelectedCompanies(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const handlePractice = async (problem) => {
    try {
      toast.loading('Creating room...')
      const { data } = await createRoom({ problemSlug: problem.slug })
      toast.success(`Room created! Starting ${problem.title}...`)
      navigate(`/room/${data.roomId}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create room'))
    }
  }

  const activeFilterCount = (difficulty !== 'all' ? 1 : 0) + selectedCompanies.length + (tagSearch ? 1 : 0)

  const easyPercent = problemStats.total > 0 ? (problemStats.easy / problemStats.total) * 100 : 0
  const mediumPercent = problemStats.total > 0 ? (problemStats.medium / problemStats.total) * 100 : 0
  const hardPercent = problemStats.total > 0 ? (problemStats.hard / problemStats.total) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Problems</h1>
          <p className="text-gray-400">Browse and practice algorithmic problems</p>
        </div>

        {problemStats.total > 0 && (
          <div className="mb-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                {solvedStats.easy} / {problemStats.easy} Easy
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                {solvedStats.medium} / {problemStats.medium} Medium
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                {solvedStats.hard} / {problemStats.hard} Hard
              </span>
              <span className="text-sm text-gray-400 ml-auto">
                {solvedStats.total} / {problemStats.total} solved
              </span>
            </div>
            <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden flex">
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
            <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden flex">
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

        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1" role="radiogroup" aria-label="Filter by difficulty">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setCurrentPage(1) }}
                  role="radio"
                  aria-checked={difficulty === d}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 ${
                    difficulty === d
                      ? d === 'easy' ? 'bg-green-700 text-white focus:ring-green-500'
                        : d === 'medium' ? 'bg-amber-700 text-white focus:ring-amber-500'
                        : d === 'hard' ? 'bg-red-700 text-white focus:ring-red-500'
                        : 'bg-indigo-600 text-white focus:ring-indigo-500'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {d === 'all' ? 'All' : d}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
              <input
                type="text"
                value={tagSearch}
                onChange={e => { setTagSearch(e.target.value); setCurrentPage(1) }}
                placeholder="Search by tag..."
                aria-label="Search problems by tag"
                className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950"
              />
              {tagSearch && (
                <button
                  onClick={() => { setTagSearch(''); setCurrentPage(1) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                  aria-label="Clear tag search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-indigo-600 border-indigo-500 text-white focus:ring-indigo-500'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 focus:ring-indigo-500'
              }`}
              aria-label={`Toggle advanced filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-white/20 text-white text-xs px-1.5 rounded-full">{activeFilterCount}</span>
              )}
            </button>

            <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 ml-auto" role="radiogroup" aria-label="View mode">
              <button
                onClick={() => setViewMode('table')}
                role="radio"
                aria-checked={viewMode === 'table'}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
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
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                aria-label="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Companies</p>
                <div className="flex flex-wrap gap-2">
                  {COMPANIES.map(c => (
                    <button
                      key={c}
                      onClick={() => toggleCompany(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        selectedCompanies.includes(c)
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['#', 'Title', 'Difficulty', 'Tags', 'Acceptance', 'Solved'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
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
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
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
            <button onClick={() => window.location.reload()} className="btn-secondary text-sm">
              Retry
            </button>
          </div>
        ) : problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Search className="w-10 h-10 text-gray-600" />
            <p className="text-gray-400">No problems found matching your filters.</p>
            <button
              onClick={() => { setDifficulty('all'); setTagSearch(''); setSelectedCompanies([]); setCurrentPage(1) }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Difficulty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Acceptance</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Solved</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem, idx) => {
                  const globalIndex = (currentPage - 1) * PROBLEMS_PER_PAGE + idx + 1
                  const isSolved = solvedSlugs.has(problem.slug)
                  return (
                    <tr
                      key={problem._id || problem.id}
                      className={`border-b border-gray-800/50 hover:border-l-2 hover:border-l-indigo-500 transition-colors ${
                        idx % 2 === 0 ? 'bg-[#11111f]' : 'bg-[#0a0a14]'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500">{globalIndex}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/problems/${problem.slug}`}
                          className="font-medium text-gray-100 hover:text-indigo-400 transition-colors"
                        >
                          {problem.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={problem.difficulty?.toLowerCase() || 'default'}>
                          {problem.difficulty}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(problem.tags || []).slice(0, 3).map(t => (
                            <span key={t} className="text-xs bg-indigo-900/40 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/50">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {problem.acceptanceRate != null ? `${problem.acceptanceRate}%` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isSolved ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-gray-600">—</span>
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
            {problems.map(problem => {
              const isSolved = solvedSlugs.has(problem.slug)
              return (
                <div
                  key={problem._id || problem.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/problems/${problem.slug}`}
                        className="font-semibold text-gray-100 hover:text-indigo-400 transition-colors leading-tight"
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
                    <Badge variant={problem.difficulty?.toLowerCase() || 'default'}>
                      {problem.difficulty}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(problem.tags || []).slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-indigo-900/40 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/50">
                        {t}
                      </span>
                    ))}
                  </div>

                  {problem.acceptanceRate != null && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{problem.acceptanceRate}% acceptance</span>
                    </div>
                  )}

                  <button
                    onClick={() => handlePractice(problem)}
                    className="mt-auto w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    Practice &rarr;
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing <span className="font-medium text-gray-200">{startItem}</span>–<span className="font-medium text-gray-200">{endItem}</span> of <span className="font-medium text-gray-200">{totalProblems}</span> problems
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-sm">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === p
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
