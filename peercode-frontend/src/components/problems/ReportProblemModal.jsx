import { useState } from 'react'
import Modal from '../common/Modal'
import toast from 'react-hot-toast'
import { reportProblem, getErrorMessage } from '../../services/api'

const REPORT_TYPES = [
  { value: 'wrong-answer', label: 'Wrong Answer' },
  { value: 'broken-testcase', label: 'Broken Test Case' },
  { value: 'unclear-description', label: 'Unclear Description' },
  { value: 'other', label: 'Other' },
]

export default function ReportProblemModal({ isOpen, onClose, problemId, problemTitle }) {
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!type) { toast.error('Please select a report type'); return }
    if (description.length < 10) { toast.error('Description must be at least 10 characters'); return }
    setSubmitting(true)
    try {
      await reportProblem(problemId, { type, description })
      toast.success('Report submitted. Thank you!')
      onClose()
      setType('')
      setDescription('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit report'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Report: ${problemTitle || 'Problem'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Issue Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select a type...</option>
            {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Describe the issue in detail (10-500 characters)..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors">
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
