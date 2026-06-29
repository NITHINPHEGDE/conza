import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Ban, CheckCircle, Trash2, User } from 'lucide-react'
import useCustomerStore from '../../store/customers/useCustomerStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function CustomerList() {
  const {
    filters, setFilters, fetchCustomers, getFilteredCustomers,
    updateCustomerStatus, deleteCustomer, loading, error,
  } = useCustomerStore()
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [filters.status, filters.search])

  const filtered = getFilteredCustomers()

  const handleAction = (customer, action) => {
    setSelectedCustomer(customer)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'suspend') updateCustomerStatus(selectedCustomer.id, 'suspended')
    if (modalAction === 'activate') updateCustomerStatus(selectedCustomer.id, 'active')
    if (modalAction === 'delete') deleteCustomer(selectedCustomer.id)
    setModalOpen(false)
  }

  const columns = [
    { key: 'fullName', title: 'Customer', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surfaceElevated flex items-center justify-center">
          <User size={14} className="text-textMuted" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.fullName}</p>
          <p className="text-xs text-textMuted">{row.phone}</p>
        </div>
      </div>
    )},
    { key: 'email', title: 'Email' },
    { key: 'locationText', title: 'Location' },
    { key: 'memberSince', title: 'Member Since' },
    { key: 'totalBookings', title: 'Bookings' },
    { key: 'walletBalance', title: 'Wallet', render: (row) => `₹${row.walletBalance}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/customers/${row.id}`}>
          <Button variant="ghost" size="sm"><Eye size={14} /></Button>
        </Link>
        {row.status === 'active' ? (
          <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'suspend')}><Ban size={14} className="text-danger" /></Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'activate')}><CheckCircle size={14} className="text-success" /></Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'delete')}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Customers' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Customers</h1>
        <div className="flex items-center gap-3">
          <SearchBar placeholder="Search customers..." onSearch={(q) => setFilters({ ...filters, search: q })} />
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </div>
      </div>

      {loading && <p className="text-sm text-textMuted">Loading customers...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-textMuted">No registered customers found.</p>
      )}

      {!loading && filtered.length > 0 && (
        <Table columns={columns} data={filtered} onRowClick={(row) => window.location.href = `/customers/${row.id}`} />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction.charAt(0).toUpperCase() + modalAction.slice(1)} Customer`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={modalAction === 'delete' ? 'danger' : 'primary'} onClick={confirmAction}>
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-textSecondary">
          Are you sure you want to {modalAction} <strong>{selectedCustomer?.fullName}</strong>?
        </p>
      </Modal>
    </div>
  )
}
