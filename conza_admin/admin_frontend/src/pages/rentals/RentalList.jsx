import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, CheckCircle, XCircle, Truck } from 'lucide-react'
import useRentalStore from '../../store/rentals/useRentalStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function RentalList() {
  const { rentals, fetchRentals, updateRental, deleteRental, loading, error } = useRentalStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  useEffect(() => {
    fetchRentals()
  }, [])

  const filtered = rentals.filter((r) =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.vendor?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = (rental, action) => {
    setSelected(rental)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = async () => {
    if (modalAction === 'approve') await updateRental(selected.id, { isAvailable: true })
    if (modalAction === 'remove') await deleteRental(selected.id)
    setModalOpen(false)
  }

  const columns = [
    { key: 'title', title: 'Rental Item', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
          <Truck size={14} className="text-cyan-700" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.title}</p>
          <p className="text-xs text-textMuted">{row.category}</p>
        </div>
      </div>
    )},
    { key: 'vendor', title: 'Vendor', render: (row) => (
      <div>
        <p className="text-sm text-textPrimary">{row.vendor}</p>
        {row.vendorCity && <p className="text-xs text-textMuted">{row.vendorCity}</p>}
      </div>
    )},
    { key: 'price', title: 'Price/Day', render: (row) => `₹${row.price}` },
    { key: 'deposit', title: 'Deposit', render: (row) => `₹${row.deposit}` },
    { key: 'stock', title: 'Available' },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/rentals/${row.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'approve')}><CheckCircle size={14} className="text-success" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'remove')}><XCircle size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Rentals' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Rentals</h1>
        <SearchBar placeholder="Search rentals..." onSearch={setSearch} />
      </div>

      {loading && <p className="text-sm text-textMuted">Loading rentals...</p>}
      {!loading && error && <p className="text-sm text-danger">{error}</p>}
      {!loading && !error && (
        <Table columns={columns} data={filtered} onRowClick={(row) => navigate(`/rentals/${row.id}`)} />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction.charAt(0).toUpperCase() + modalAction.slice(1)} Rental`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={modalAction === 'remove' ? 'danger' : 'primary'} onClick={confirmAction}>Confirm</Button>
          </>
        }
      >
        <p className="text-textSecondary">Are you sure you want to {modalAction} <strong>{selected?.title}</strong>?</p>
      </Modal>
    </div>
  )
}
