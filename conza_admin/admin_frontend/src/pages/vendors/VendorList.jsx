import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Ban, CheckCircle, Store, ShieldCheck, ShieldX } from 'lucide-react'
import useVendorStore from '../../store/vendors/useVendorStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function VendorList() {
  const { vendors, fetchVendors, updateVendorStatus, loading, error } = useVendorStore()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ status: 'all', type: 'all', search: '' })
  const [activeTab, setActiveTab] = useState('verified')
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  useEffect(() => {
    fetchVendors()
  }, [])

  const verifiedVendors = vendors.filter(v => v.isVerified === true)
  const unverifiedVendors = vendors.filter(v => v.isVerified !== true)
  const displayedVendors = activeTab === 'verified' ? verifiedVendors : unverifiedVendors

  const getFilteredVendors = () => {
    return displayedVendors.filter((v) => {
      if (filters.status !== 'all' && v.status !== filters.status) return false
      if (filters.type !== 'all' && v.sellerType !== filters.type) return false
      if (filters.search && !v.shopName.toLowerCase().includes(filters.search.toLowerCase()) && !v.name.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }

  const filtered = getFilteredVendors()

  const handleAction = (vendor, action) => {
    setSelectedVendor(vendor)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'suspend') updateVendorStatus(selectedVendor.id, 'suspended')
    if (modalAction === 'activate') updateVendorStatus(selectedVendor.id, 'active')
    if (modalAction === 'delete') {/* delete */}
    setModalOpen(false)
  }

  const columns = [
    { key: 'shopName', title: 'Vendor', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <Store size={14} className="text-green-700" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.shopName}</p>
          <p className="text-xs text-textMuted">{row.name}</p>
        </div>
      </div>
    )},
    { key: 'sellerType', title: 'Type', render: (row) => <StatusBadge status={row.sellerType} label={row.sellerType} /> },
    { key: 'city', title: 'City' },
    { key: 'totalOrders', title: 'Orders' },
    { key: 'totalRevenue', title: 'Revenue', render: (row) => `₹${(row.totalRevenue / 100000).toFixed(1)}L` },
    { key: 'rating', title: 'Rating', render: (row) => `⭐ ${row.rating}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/vendors/${row.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
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
      <Breadcrumb items={[{ label: 'Vendors' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Vendors</h1>
        <div className="flex items-center gap-3">
          <SearchBar placeholder="Search vendors..." onSearch={(q) => setFilters({ ...filters, search: q })} />
          <Select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'material', label: 'Material' },
              { value: 'rental', label: 'Rental' },
              { value: 'both', label: 'Both' },
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
            VERIFIED ({verifiedVendors.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('unverified')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'unverified' ? 'border-accentAmber text-accentAmber' : 'border-transparent text-textMuted hover:text-textPrimary'}`}
        >
          <span className="flex items-center gap-2">
            <ShieldX size={16} />
            UNVERIFIED ({unverifiedVendors.length})
          </span>
        </button>
      </div>

      {loading && <p className="text-sm text-textMuted">Loading vendors...</p>}
      {!loading && error && <p className="text-sm text-danger">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-textMuted">No registered vendors found.</p>
      )}
      {!loading && filtered.length > 0 && (
        <Table columns={columns} data={filtered} onRowClick={(row) => navigate(`/vendors/${row.id}`)} />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction.charAt(0).toUpperCase() + modalAction.slice(1)} Vendor`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={modalAction === 'delete' ? 'danger' : 'primary'} onClick={confirmAction}>Confirm</Button>
          </>
        }
      >
        <p className="text-textSecondary">Are you sure you want to {modalAction} <strong>{selectedVendor?.shopName}</strong>?</p>
      </Modal>
    </div>
  )
}
