import { useState, useEffect, useCallback } from 'react'
import { Eye, Phone, User, Loader } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import { useToastStore } from '../../store/notifications/useToastStore'
import complaintService from '../../services/complaintService'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'escalated', label: 'Escalated' },
]

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export default function Complaints() {
  const addToast = useToastStore((s) => s.addToast)

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: 'all', priority: 'all' })

  const [selected, setSelected] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusDraft, setStatusDraft] = useState('open')
  const [resolutionDraft, setResolutionDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await complaintService.getAll({
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        limit: 50,
      })
      setComplaints(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load complaints.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])

  const openDetails = (row) => {
    setSelected(row)
    setStatusDraft(row.status)
    setResolutionDraft(row.resolution || '')
    setDetailOpen(true)
  }

  const handleSaveStatus = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await complaintService.update(selected._id, {
        status: statusDraft,
        resolution: resolutionDraft,
      })
      const updated = res.complaint
      setComplaints((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
      addToast('Complaint status updated.', 'success')
      setDetailOpen(false)
    } catch (err) {
      addToast(err.message || 'Failed to update complaint.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'user', title: 'Customer', render: (row) => (
      <div>
        <div className="flex items-center gap-1.5 font-medium text-textPrimary">
          <User size={13} className="text-textMuted" /> {row.user}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-textMuted mt-0.5">
          <Phone size={12} /> {row.phone || '—'}
        </div>
      </div>
    )},
    { key: 'type', title: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'subject', title: 'Subject' },
    { key: 'priority', title: 'Priority', render: (row) => <StatusBadge status={row.priority} label={row.priority} /> },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} label={row.status?.replace('_', ' ')} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <Button variant="ghost" size="sm" onClick={() => openDetails(row)}><Eye size={14} /></Button>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Engagement' }, { label: 'Complaints' }]} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-textPrimary">Complaints</h1>
        <div className="flex items-center gap-3">
          <SearchBar
            placeholder="Search by name or subject..."
            onSearch={(q) => setFilters((prev) => ({ ...prev, search: q }))}
          />
          <Select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            options={STATUS_OPTIONS}
          />
          <Select
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
            options={PRIORITY_OPTIONS}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-accentAmber" /></div>
      ) : error ? (
        <div className="text-center py-12 text-danger">{error}</div>
      ) : (
        <Table columns={columns} data={complaints} rowKey="_id" onRowClick={openDetails} emptyText="No complaints reported yet." />
      )}

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Complaint Details"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetailOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSaveStatus}>Save Changes</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-textMuted text-xs mb-1">Customer Name</p>
                <p className="text-textPrimary font-medium">{selected.user}</p>
              </div>
              <div>
                <p className="text-textMuted text-xs mb-1">Phone Number</p>
                <p className="text-textPrimary font-medium">{selected.phone || '—'}</p>
              </div>
              <div>
                <p className="text-textMuted text-xs mb-1">Type</p>
                <p className="text-textPrimary capitalize">{selected.type}</p>
              </div>
              <div>
                <p className="text-textMuted text-xs mb-1">Priority</p>
                <StatusBadge status={selected.priority} label={selected.priority} />
              </div>
            </div>

            <div>
              <p className="text-textMuted text-xs mb-1">Subject</p>
              <p className="text-textPrimary font-medium">{selected.subject}</p>
            </div>

            {selected.description && (
              <div>
                <p className="text-textMuted text-xs mb-1">Description</p>
                <p className="text-textSecondary whitespace-pre-wrap">{selected.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1.5">Status</label>
              <Select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
                options={STATUS_OPTIONS.filter((o) => o.value !== 'all')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1.5">Resolution Note (visible to customer)</label>
              <textarea
                value={resolutionDraft}
                onChange={(e) => setResolutionDraft(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all"
                placeholder="Add a note about how this was resolved..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
