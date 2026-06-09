import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import toast from 'react-hot-toast'
import { updateAdminProblem, createProblem, getErrorMessage } from '../../services/api'

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go']
const DIFFICULTIES = ['easy', 'medium', 'hard']

function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function Section({ title, description, children }) {
  return (
    <div className="border border-gray-800 rounded-xl p-4 space-y-4 bg-gray-900/30">
      <div>
        <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
        {description && <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export default function AddEditProblemModal({ isOpen, onClose, problem, onSaved }) {
  const isEdit = !!problem
  const [form, setForm] = useState({
    title: '', slug: '', difficulty: 'easy', description: '',
    tags: '', companies: '', constraints: '',
    hints: '', editorial: '',
    examples: [{ input: '', output: '', explanation: '' }],
    testCases: [{ input: '', expectedOutput: '' }],
    starterCode: { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
    stubs: { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
    testHarness: { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
    timeLimit: 2000, memoryLimit: 256,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [activeLang, setActiveLang] = useState('javascript')

  useEffect(() => {
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
        starterCode: problem.starterCode || { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
        stubs: problem.stubs || { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
        testHarness: problem.testHarness || { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
        timeLimit: problem.timeLimit || 2000,
        memoryLimit: problem.memoryLimit || 256,
      })
    } else {
      setForm({
        title: '', slug: '', difficulty: 'easy', description: '',
        tags: '', companies: '', constraints: '',
        hints: '', editorial: '',
        examples: [{ input: '', output: '', explanation: '' }],
        testCases: [{ input: '', expectedOutput: '' }],
        starterCode: { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
        stubs: { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
        testHarness: { javascript: '', typescript: '', python: '', java: '', cpp: '', go: '' },
        timeLimit: 2000, memoryLimit: 256,
      })
    }
    setErrors({})
  }, [problem, isOpen])

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleArrayField = (field, index, key, value) => {
    setForm(prev => {
      const arr = [...prev[field]]
      arr[index] = { ...arr[index], [key]: value }
      return { ...prev, [field]: arr }
    })
  }

  const addArrayItem = (field, template) => setForm(prev => ({ ...prev, [field]: [...prev[field], template] }))
  const removeArrayItem = (field, index) => setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }))

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Problem title is required'
    if (!form.slug.trim()) errs.slug = 'URL slug is required (e.g. "two-sum")'
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) errs.slug = 'Slug must be lowercase with hyphens (e.g. "two-sum")'
    if (!form.description.trim()) errs.description = 'Problem description is required'
    if (!form.examples.some(e => e.input && e.output)) errs.examples = 'At least one example with input & output is required'
    if (!form.testCases.some(t => t.input && t.expectedOutput)) errs.testCases = 'At least one test case with input & expected output is required'
    if (!form.starterCode.javascript && !form.starterCode.python && !form.starterCode.java) errs.starterCode = 'At least provide starter code for JavaScript, Python, or Java'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) { toast.error('Please fix the errors in the form'); return }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
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
      if (isEdit) {
        await updateAdminProblem(problem._id, payload)
        toast.success('Problem updated successfully')
      } else {
        await createProblem(payload)
        toast.success('Problem created successfully')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save problem'))
    } finally {
      setSaving(false)
    }
  }

  const renderLangTabs = () => (
    <div className="flex gap-1 mb-2 border-b border-gray-800 pb-1">
      {LANGUAGES.map(lang => (
        <button key={lang} type="button" onClick={() => setActiveLang(lang)}
          className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${activeLang === lang ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>
          {lang}
        </button>
      ))}
    </div>
  )

  const renderLangField = (field, label, placeholder) => (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {renderLangTabs()}
      <textarea value={form[field][activeLang]}
        onChange={e => setForm(prev => ({ ...prev, [field]: { ...prev[field], [activeLang]: e.target.value } }))}
        rows={6} placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-700" />
    </div>
  )

  const inputClass = (field) => `w-full px-3 py-2 bg-gray-900 border ${field && errors[field] ? 'border-red-500' : 'border-gray-700'} rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-700 transition-colors`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Problem' : 'Add New Problem'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Basic Info */}
        <Section title="Basic Information" description="Core details about the problem">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Problem Title" required error={errors.title}>
              <input value={form.title} onChange={e => update('title', e.target.value)}
                placeholder="e.g. Two Sum"
                className={inputClass('title')} />
            </Field>
            <Field label="URL Slug" required error={errors.slug}>
              <input value={form.slug} onChange={e => update('slug', e.target.value)}
                placeholder="e.g. two-sum"
                className={inputClass('slug')} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Difficulty">
              <select value={form.difficulty} onChange={e => update('difficulty', e.target.value)}
                className={inputClass()}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </Field>
            <Field label="Time Limit (ms)">
              <input type="number" value={form.timeLimit} onChange={e => update('timeLimit', e.target.value)}
                placeholder="e.g. 2000" className={inputClass()} />
            </Field>
            <Field label="Memory Limit (MB)">
              <input type="number" value={form.memoryLimit} onChange={e => update('memoryLimit', e.target.value)}
                placeholder="e.g. 256" className={inputClass()} />
            </Field>
          </div>
          <Field label="Description" required error={errors.description}>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4}
              placeholder="Describe the problem, what the user needs to implement, and any background context..."
              className={`${inputClass('description')} resize-none`} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tags (comma-separated)">
              <input value={form.tags} onChange={e => update('tags', e.target.value)}
                placeholder="e.g. array, hash-table, sorting"
                className={inputClass()} />
            </Field>
            <Field label="Companies (comma-separated)">
              <input value={form.companies} onChange={e => update('companies', e.target.value)}
                placeholder="e.g. amazon, google, microsoft"
                className={inputClass()} />
            </Field>
          </div>
          <Field label="Constraints">
            <textarea value={form.constraints} onChange={e => update('constraints', e.target.value)} rows={2}
              placeholder="e.g. 1 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9"
              className={`${inputClass()} resize-none`} />
          </Field>
        </Section>

        {/* Hints & Editorial */}
        <Section title="Hints & Editorial" description="Help users solve the problem">
          <Field label="Hints (one per line)">
            <textarea value={form.hints} onChange={e => update('hints', e.target.value)} rows={3}
              placeholder="Hint 1: Try using a hash map to store complements&#10;Hint 2: Iterate through the array once and check if target - num exists in the map"
              className={`${inputClass()} resize-none`} />
          </Field>
          <Field label="Editorial / Solution Explanation">
            <textarea value={form.editorial} onChange={e => update('editorial', e.target.value)} rows={4}
              placeholder="Explain the optimal approach, time/space complexity, and reasoning behind the solution..."
              className={`${inputClass()} resize-none`} />
          </Field>
        </Section>

        {/* Examples */}
        <Section title="Examples" description="Show users what the input/output looks like" required>
          {errors.examples && <p className="text-[11px] text-red-400">{errors.examples}</p>}
          <div className="space-y-3">
            {form.examples.map((ex, i) => (
              <div key={i} className="flex gap-2 items-start bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Input</span>
                      <input placeholder='e.g. nums = [2,7,11,15], target = 9'
                        value={ex.input} onChange={e => handleArrayField('examples', i, 'input', e.target.value)}
                        className="w-full px-2 py-1.5 mt-0.5 bg-gray-800 border border-gray-700 rounded text-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-700" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">Output</span>
                      <input placeholder='e.g. [0,1]'
                        value={ex.output} onChange={e => handleArrayField('examples', i, 'output', e.target.value)}
                        className="w-full px-2 py-1.5 mt-0.5 bg-gray-800 border border-gray-700 rounded text-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-700" />
                    </div>
                  </div>
                  <input placeholder="Explanation (optional) — e.g. nums[0] + nums[1] == 9, so we return [0,1]"
                    value={ex.explanation} onChange={e => handleArrayField('examples', i, 'explanation', e.target.value)}
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-700" />
                </div>
                {form.examples.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('examples', i)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all mt-5">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('examples', { input: '', output: '', explanation: '' })}
              className="w-full py-2 rounded-lg text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-dashed border-indigo-500/30 transition-all">
              + Add Example
            </button>
          </div>
        </Section>

        {/* Test Cases */}
        <Section title="Test Cases" description="Hidden test cases used for judging solutions" required>
          {errors.testCases && <p className="text-[11px] text-red-400">{errors.testCases}</p>}
          <div className="space-y-3">
            {form.testCases.map((tc, i) => (
              <div key={i} className="flex gap-2 items-start bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                <div className="flex-1 flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Input</span>
                    <input placeholder='e.g. [2,7,11,15]&#10;9'
                      value={tc.input} onChange={e => handleArrayField('testCases', i, 'input', e.target.value)}
                      className="w-full px-2 py-1.5 mt-0.5 bg-gray-800 border border-gray-700 rounded text-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-700" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Expected Output</span>
                    <input placeholder='e.g. [0,1]'
                      value={tc.expectedOutput} onChange={e => handleArrayField('testCases', i, 'expectedOutput', e.target.value)}
                      className="w-full px-2 py-1.5 mt-0.5 bg-gray-800 border border-gray-700 rounded text-gray-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-700" />
                  </div>
                </div>
                {form.testCases.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('testCases', i)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-all mt-5">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('testCases', { input: '', expectedOutput: '' })}
              className="w-full py-2 rounded-lg text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-dashed border-indigo-500/30 transition-all">
              + Add Test Case
            </button>
          </div>
        </Section>

        {/* Code Templates */}
        <Section title="Code Templates" description="Starter code, function stubs, and test harness for each language">
          {errors.starterCode && <p className="text-[11px] text-red-400">{errors.starterCode}</p>}
          <div className="space-y-4">
            {renderLangField('starterCode', 'Starter Code (shown to user when they open the problem)',
              'function twoSum(nums, target) {\n  // Write your code here\n}')}
            {renderLangField('stubs', 'Function Stubs (type signatures / function declarations)',
              '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  \n}')}
            {renderLangField('testHarness', 'Test Harness (code that runs the test cases)',
              '// Test runner\nconst tests = [\n  { input: [[2,7,11,15], 9], expected: [0,1] },\n  { input: [[3,2,4], 6], expected: [1,2] },\n];')}
          </div>
        </Section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <p className="text-[11px] text-gray-600">Fields marked with <span className="text-red-400">*</span> are required</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20">
              {saving ? <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="8" /></svg>Saving...</span> : isEdit ? 'Update Problem' : 'Create Problem'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
