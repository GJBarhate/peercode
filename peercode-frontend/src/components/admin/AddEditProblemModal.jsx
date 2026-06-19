import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, Code2, BookOpen, FileText, TestTube2, Lightbulb } from 'lucide-react'
import Modal from '../common/Modal'
import toast from 'react-hot-toast'
import { updateAdminProblem, createProblem, getErrorMessage } from '../../services/api'

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go']
const DIFFICULTIES = ['easy', 'medium', 'hard']

const LANG_PLACEHOLDER = {
  javascript: {
    starter: 'var twoSum = function(nums, target) {\n  // Your solution here\n  return [];\n};',
    stubs: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n\n};',
    harness: '// Test harness — call your function and print results\nconst result = twoSum(nums, target);\nconsole.log(JSON.stringify(result));',
  },
  python: {
    starter: 'def twoSum(nums, target):\n    # Your solution here\n    return []',
    stubs: 'from typing import List\n\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass',
    harness: '# Test harness\nresult = solution.twoSum(nums, target)\nprint(result)',
  },
  java: {
    starter: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here\n        return new int[]{};\n    }\n}',
    stubs: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n\n    }\n}',
    harness: '// Harness\nint[] result = solution.twoSum(nums, target);\nSystem.out.println(Arrays.toString(result));',
  },
}

/* ── helpers ── */
function Field({ label, required, children, error, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function CollapsibleSection({ title, icon: Icon, iconColor = 'text-indigo-400', defaultOpen = true, children, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className={`w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <span className="font-semibold text-sm text-gray-200 flex-1">{title}</span>
        {badge && <span className="text-[11px] px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">{badge}</span>}
        {open ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">{children}</div>}
    </div>
  )
}

const inputCls = (err) =>
  `w-full px-3 py-2 bg-gray-900 border ${err ? 'border-red-500' : 'border-gray-700'} rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-700 transition-colors`

const textareaCls = (err, mono = false) =>
  `w-full px-3 py-2 bg-gray-900 border ${err ? 'border-red-500' : 'border-gray-700'} rounded-lg text-gray-200 ${mono ? 'text-xs font-mono' : 'text-sm'} focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-700 resize-none transition-colors`

function LangTabs({ activeLang, setActiveLang }) {
  return (
    <div className="flex gap-1 mb-3 border-b border-gray-800 pb-2">
      {LANGUAGES.map(lang => (
        <button key={lang} type="button" onClick={() => setActiveLang(lang)}
          className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors uppercase tracking-wider ${
            activeLang === lang ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-600 hover:text-gray-300'
          }`}>
          {lang === 'javascript' ? 'JS' : lang === 'typescript' ? 'TS' : lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
        </button>
      ))}
    </div>
  )
}

function CodeField({ field, label, rows = 7, activeLang, setActiveLang, form, setLang, errors }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-2">{label}</label>
      <LangTabs activeLang={activeLang} setActiveLang={setActiveLang} />
      <textarea
        value={form[field][activeLang]}
        onChange={e => setLang(field, e.target.value)}
        rows={rows}
        placeholder={LANG_PLACEHOLDER[activeLang]?.[field === 'starterCode' ? 'starter' : field === 'stubs' ? 'stubs' : 'harness'] || `// ${label} for ${activeLang}`}
        className={textareaCls(field === 'starterCode' && errors.starterCode, true)}
      />
    </div>
  )
}

export default function AddEditProblemModal({ isOpen, onClose, problem, onSaved }) {
  const isEdit = !!problem
  const blank = {
    title: '', slug: '', difficulty: 'easy', description: '',
    tags: '', companies: '', constraints: '',
    hints: '', editorial: '',
    examples: [{ input: '', output: '', explanation: '' }],
    testCases: [{ input: '', expectedOutput: '' }],
    starterCode: { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
    stubs:       { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
    testHarness: { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
    timeLimit: 2000, memoryLimit: 256,
  }
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [activeLang, setActiveLang] = useState('javascript')

  useEffect(() => {
    if (!isOpen) return
    if (problem) {
      setForm({
        title: problem.title || '',
        slug: problem.slug || '',
        difficulty: problem.difficulty || 'easy',
        description: problem.description || '',
        tags: (problem.tags || []).join(', '),
        companies: (problem.companies || []).join(', '),
        constraints: problem.constraints || '',
        hints: (problem.hints || []).join('\n'),
        editorial: problem.editorial || '',
        examples: problem.examples?.length ? problem.examples : [{ input: '', output: '', explanation: '' }],
        testCases: problem.testCases?.length ? problem.testCases : [{ input: '', expectedOutput: '' }],
        starterCode: { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '', ...(problem.starterCode || {}) },
        stubs:       { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '', ...(problem.stubs       || {}) },
        testHarness: { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '', ...(problem.testHarness || {}) },
        timeLimit: problem.timeLimit || 2000,
        memoryLimit: problem.memoryLimit || 256,
      })
    } else {
      setForm(blank)
    }
    setErrors({})
    setActiveLang('javascript')
  }, [problem, isOpen])

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }

  const setArr = (field, index, key, value) =>
    setForm(p => { const a = [...p[field]]; a[index] = { ...a[index], [key]: value }; return { ...p, [field]: a } })

  const addArr = (field, tpl) => setForm(p => ({ ...p, [field]: [...p[field], tpl] }))
  const delArr = (field, i) => setForm(p => ({ ...p, [field]: p[field].filter((_, j) => j !== i) }))

  const setLang = (field, value) =>
    setForm(p => ({ ...p, [field]: { ...p[field], [activeLang]: value } }))

  /* auto-generate slug from title */
  const handleTitleChange = (v) => {
    set('title', v)
    if (!isEdit || !form.slug) {
      set('slug', v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    }
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.slug.trim()) e.slug = 'Slug is required'
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) e.slug = 'Lowercase letters, numbers and hyphens only'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.examples.some(ex => ex.input && ex.output)) e.examples = 'At least one example with input & output is required'
    if (!form.testCases.some(tc => tc.input && tc.expectedOutput)) e.testCases = 'At least one test case with input & expected output is required'
    if (!form.starterCode.javascript && !form.starterCode.python && !form.starterCode.java)
      e.starterCode = 'Provide starter code in at least one language (JS, Python, or Java)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) { toast.error('Fix the errors highlighted below'); return }
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase(),
      difficulty: form.difficulty,
      description: form.description,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      companies: form.companies.split(',').map(s => s.trim()).filter(Boolean),
      constraints: form.constraints,
      hints: form.hints.split('\n').map(s => s.trim()).filter(Boolean),
      editorial: form.editorial,
      examples: form.examples.filter(e => e.input || e.output),
      testCases: form.testCases.filter(t => t.input || t.expectedOutput),
      starterCode: form.starterCode,
      stubs: form.stubs,
      testHarness: form.testHarness,
      timeLimit: Number(form.timeLimit),
      memoryLimit: Number(form.memoryLimit),
    }
    setSaving(true)
    try {
      if (isEdit) { await updateAdminProblem(problem._id, payload); toast.success('Problem updated') }
      else         { await createProblem(payload); toast.success('Problem created') }
      onSaved?.(); onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save problem'))
    } finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Edit: ${problem?.title}` : 'Add New Problem'} size="xl">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 pb-2">

          {/* ── 1. Basic Info ── */}
          <CollapsibleSection title="Basic Information" icon={FileText} iconColor="text-blue-400">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Problem Title" required error={errors.title}>
                <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                  placeholder="e.g. Two Sum" className={inputCls(errors.title)} />
              </Field>
              <Field label="URL Slug" required error={errors.slug} hint="Auto-generated from title — lowercase, hyphens only">
                <input value={form.slug} onChange={e => set('slug', e.target.value)}
                  placeholder="e.g. two-sum" className={inputCls(errors.slug)} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Difficulty">
                <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className={inputCls()}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Time Limit (ms)">
                <input type="number" value={form.timeLimit} onChange={e => set('timeLimit', e.target.value)}
                  placeholder="2000" className={inputCls()} />
              </Field>
              <Field label="Memory Limit (MB)">
                <input type="number" value={form.memoryLimit} onChange={e => set('memoryLimit', e.target.value)}
                  placeholder="256" className={inputCls()} />
              </Field>
            </div>
            <Field label="Description" required error={errors.description} hint="Supports basic markdown: **bold**, `code`, # headings, ``` code blocks, - lists">
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5}
                placeholder="Describe the problem clearly. You can use Markdown for formatting."
                className={textareaCls(errors.description)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tags" hint="Comma-separated: array, hash-table, sorting">
                <input value={form.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="array, hash-table, dynamic-programming" className={inputCls()} />
              </Field>
              <Field label="Companies" hint="Comma-separated: google, amazon">
                <input value={form.companies} onChange={e => set('companies', e.target.value)}
                  placeholder="google, amazon, microsoft" className={inputCls()} />
              </Field>
            </div>
            <Field label="Constraints">
              <textarea value={form.constraints} onChange={e => set('constraints', e.target.value)} rows={3}
                placeholder="1 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9&#10;Only one valid answer exists."
                className={textareaCls()} />
            </Field>
          </CollapsibleSection>

          {/* ── 2. Examples ── */}
          <CollapsibleSection title="Examples" icon={TestTube2} iconColor="text-emerald-400" badge={`${form.examples.length}`}>
            {errors.examples && <p className="text-[11px] text-red-400 -mt-2">{errors.examples}</p>}
            <div className="space-y-3">
              {form.examples.map((ex, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Example {i + 1}</span>
                    {form.examples.length > 1 && (
                      <button type="button" onClick={() => delArr('examples', i)}
                        className="p-1 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Input</label>
                      <textarea
                        value={ex.input}
                        onChange={e => setArr('examples', i, 'input', e.target.value)}
                        placeholder={'nums = [2,7,11,15]\ntarget = 9'}
                        rows={3}
                        className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none placeholder-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Output</label>
                      <textarea
                        value={ex.output}
                        onChange={e => setArr('examples', i, 'output', e.target.value)}
                        placeholder={'[0,1]'}
                        rows={3}
                        className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none placeholder-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Explanation (optional)</label>
                    <input
                      value={ex.explanation}
                      onChange={e => setArr('examples', i, 'explanation', e.target.value)}
                      placeholder="nums[0] + nums[1] = 2 + 7 = 9, so we return [0, 1]"
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-700"
                    />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addArr('examples', { input: '', output: '', explanation: '' })}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/8 hover:bg-emerald-500/15 border border-dashed border-emerald-500/25 transition-all flex items-center justify-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Example
              </button>
            </div>
          </CollapsibleSection>

          {/* ── 3. Test Cases ── */}
          <CollapsibleSection title="Test Cases" icon={TestTube2} iconColor="text-amber-400" badge={`${form.testCases.length}`}>
            <p className="text-[11px] text-gray-600 -mt-2">
              These are used to judge submissions. For multi-parameter inputs, put each parameter on a separate line.
            </p>
            {errors.testCases && <p className="text-[11px] text-red-400">{errors.testCases}</p>}
            <div className="space-y-3">
              {form.testCases.map((tc, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Test Case {i + 1}</span>
                    {form.testCases.length > 1 && (
                      <button type="button" onClick={() => delArr('testCases', i)}
                        className="p-1 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={e => setArr('testCases', i, 'input', e.target.value)}
                        placeholder={'[2,7,11,15]\n9'}
                        rows={4}
                        className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none placeholder-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Expected Output</label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={e => setArr('testCases', i, 'expectedOutput', e.target.value)}
                        placeholder={'[0,1]'}
                        rows={4}
                        className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none placeholder-gray-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addArr('testCases', { input: '', expectedOutput: '' })}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/8 hover:bg-amber-500/15 border border-dashed border-amber-500/25 transition-all flex items-center justify-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Test Case
              </button>
            </div>
          </CollapsibleSection>

          {/* ── 4. Hints & Editorial ── */}
          <CollapsibleSection title="Hints & Editorial" icon={Lightbulb} iconColor="text-violet-400">
            <Field label="Hints" hint="One hint per line. Users reveal them one at a time.">
              <textarea value={form.hints} onChange={e => set('hints', e.target.value)} rows={4}
                placeholder={"Hint 1: Try using a hash map to store complements.\nHint 2: Iterate through the array once and check if target - num exists in the map."}
                className={textareaCls()} />
            </Field>
            <Field label="Editorial / Solution Explanation" hint="Supports Markdown: # headings, **bold**, `code`, ``` code blocks, - lists">
              <div className="space-y-1">
                <div className="flex gap-2 text-[10px] text-gray-600 pb-1">
                  <span className="px-1.5 py-0.5 bg-gray-800 rounded font-mono"># Approach</span>
                  <span className="px-1.5 py-0.5 bg-gray-800 rounded font-mono">**bold**</span>
                  <span className="px-1.5 py-0.5 bg-gray-800 rounded font-mono">`inline`</span>
                  <span className="px-1.5 py-0.5 bg-gray-800 rounded font-mono">``` code blocks</span>
                  <span className="px-1.5 py-0.5 bg-gray-800 rounded font-mono">- lists</span>
                </div>
                <textarea
                  value={form.editorial}
                  onChange={e => set('editorial', e.target.value)}
                  rows={12}
                  placeholder={`## Approach\n\nThe key insight is to use a **hash map** to store the complement of each number.\n\n## Complexity\n\n- **Time:** O(n) — single pass through the array\n- **Space:** O(n) — hash map storage\n\n## Solution\n\n\`\`\`javascript\nvar twoSum = function(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n};\n\`\`\``}
                  className={textareaCls(false, true)}
                />
                <p className="text-[11px] text-gray-600">{form.editorial.length} chars</p>
              </div>
            </Field>
          </CollapsibleSection>

          {/* ── 5. Code Templates ── */}
          <CollapsibleSection title="Code Templates" icon={Code2} iconColor="text-cyan-400" defaultOpen={false}>
            <p className="text-[11px] text-gray-600 -mt-2">
              Switch languages with the tabs above each field. Starter code is shown to users; stubs are function signatures; test harness is the execution wrapper.
            </p>
            {errors.starterCode && <p className="text-[11px] text-red-400">{errors.starterCode}</p>}
            <div className="space-y-6">
              <CodeField field="starterCode" label="Starter Code (shown to the user)" rows={7} activeLang={activeLang} setActiveLang={setActiveLang} form={form} setLang={setLang} errors={errors} />
              <div className="border-t border-gray-800 pt-5">
                <CodeField field="stubs" label="Function Stubs (type signatures)" rows={6} activeLang={activeLang} setActiveLang={setActiveLang} form={form} setLang={setLang} errors={errors} />
              </div>
              <div className="border-t border-gray-800 pt-5">
                <CodeField field="testHarness" label="Test Harness (code that runs the tests — advanced)" rows={6} activeLang={activeLang} setActiveLang={setActiveLang} form={form} setLang={setLang} errors={errors} />
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800 mt-4">
          <p className="text-[11px] text-gray-600"><span className="text-red-400">*</span> required</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : isEdit ? 'Update Problem' : 'Create Problem'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
