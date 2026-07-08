import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Ban, CheckCircle, HardHat, ShieldCheck, ShieldX } from 'lucide-react'
import useWorkerStore from '../../store/workers/useWorkerStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function WorkerList() {
  const { workers, fetchWorkers, updateWorkerStatus, deleteCustomer, loading, error } = useWorkerStore()
  const [filters, setFilters] = useState({ status: 'all', category: 'all', search: '', verification: 'all' })
  const [activeTab, setActiveTab] = useState('verified')
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  useEffect(() => {
    fetchWorkers()
  }, [])

  const verifiedWorkers = workers.filter(w => w.isVerified === true)
  const unverifiedWorkers = workers.filter(w => w.isVerified !== true)
  const displayedWorkers = activeTab === 'verified' ? verifiedWorkers : unverifiedWorkers

  const getFilteredWorkers = () => {
    return displayedWorkers.filter((w) => {
      if (filters.status !== 'all' && w.status !== filters.status) return false
      if (filters.category !== 'all' && w.category !== filters.category) return false
      if (filters.search && !w.fullName?.toLowerCase().includes(filters.search.toLowerCase()) && !w.phone?.includes(filters.search)) return false
      return true
    })
  }

  const filtered = getFilteredWorkers()

  const handleAction = (worker, action) => {
    setSelectedWorker(worker)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'suspend') updateWorkerStatus(selectedWorker.id, 'suspended')
    if (modalAction === 'activate') updateWorkerStatus(selectedWorker.id, 'active')
    if (modalAction === 'delete') deleteCustomer(selectedWorker.id)
    setModalOpen(false)
  }

  const columns = [
    { key: 'fullName', title: 'Worker', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accentYellowSoft flex items-center justify-center">
          <HardHat size={14} className="text-accentAmber" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.fullName}</p>
          <p className="text-xs text-textMuted">{row.phone}</p>
        </div>
      </div>
    )},
    { key: 'category', title: 'Category' },
    { key: 'skills', title: 'Skills', render: (row) => (
      <div className="flex flex-wrap gap-1">
        {(row.skills || []).slice(0, 2).map((s) => (
          <span key={s} className="px-2 py-0.5 bg-surfaceElevated rounded text-xs text-textSecondary">{s}</span>
        ))}
        {(row.skills || []).length > 2 && <span className="text-xs text-textMuted">+{row.skills.length - 2}</span>}
      </div>
    )},
    { key: 'minCharge', title: 'Hourly', render: (row) => `₹${row.minCharge ?? 0}` },
    { key: 'baseCharge', title: 'Base', render: (row) => `₹${row.baseCharge ?? 0}` },
    { key: 'perDayCharge', title: 'Per Day', render: (row) => `₹${row.perDayCharge ?? 0}` },
    { key: 'rating', title: 'Rating', render: (row) => `⭐ ${row.rating}` },
    { key: 'totalJobs', title: 'Jobs' },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/workers/${row.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
        {row.status === 'active' ? (
          <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'suspend')}><Ban size={14} className="text-danger" /></Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'activate')}><CheckCircle size={14} className="text-success" /></Button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Workers' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Workers</h1>
        <div className="flex items-center gap-3">
          <SearchBar placeholder="Search workers..." onSearch={(q) => setFilters({ ...filters, search: q })} />
          <Select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'Plumber', label: 'Plumber' },
              { value: 'Electrician', label: 'Electrician' },
              { value: 'Carpenter', label: 'Carpenter' },
              { value: 'Mason', label: 'Mason' },
              { value: 'Painter', label: 'Painter' },
              { value: 'Builder', label: 'Builder' },
            ]}
          />
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'pending_verification', label: 'Pending' },
            ]}
          />
        </div>
      </div>

      {/* Verified / Unverified Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'verified' ? 'border-accentAmber text-accentAmber' : 'border-transparent text-textMuted hover:text-textPrimary'}`}
        >
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} />
            VERIFIED ({verifiedWorkers.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('unverified')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'unverified' ? 'border-accentAmber text-accentAmber' : 'border-transparent text-textMuted hover:text-textPrimary'}`}
        >
          <span className="flex items-center gap-2">
            <ShieldX size={16} />
            UNVERIFIED ({unverifiedWorkers.length})
          </span>
        </button>
      </div>

      {loading && <p className="text-sm text-textMuted">Loading workers...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-textMuted">No registered workers found.</p>
      )}

      {!loading && filtered.length > 0 && (
        <Table columns={columns} data={filtered} onRowClick={(row) => window.location.href = `/workers/${row.id}`} />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction.charAt(0).toUpperCase() + modalAction.slice(1)} Worker`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={modalAction === 'delete' ? 'danger' : 'primary'} onClick={confirmAction}>Confirm</Button>
          </>
        }
      >
        <p className="text-textSecondary">Are you sure you want to {modalAction} <strong>{selectedWorker?.fullName}</strong>?</p>
      </Modal>
    </div>
  )
}
