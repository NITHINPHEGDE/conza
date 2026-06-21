import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, CheckCircle, XCircle, Truck } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockRentals = [
  { id: '1', title: 'Concrete Mixer', vendor: 'RentEquip Bangalore', category: 'Equipment', price: 800, stock: 3, status: 'active', deposit: 5000 },
  { id: '2', title: 'Scaffolding Set', vendor: 'BuildMart Pro', category: 'Safety', price: 1200, stock: 5, status: 'active', deposit: 3000 },
  { id: '3', title: 'Power Generator 5KVA', vendor: 'QuickBuild Supply', category: 'Power', price: 1500, stock: 1, status: 'low_stock', deposit: 8000 },
  { id: '4', title: 'Jackhammer', vendor: 'RentEquip Bangalore', category: 'Tools', price: 600, stock: 0, status: 'out_of_stock', deposit: 2000 },
]

export default function RentalList() {
  const [rentals, setRentals] = useState(mockRentals)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  const filtered = rentals.filter((r) => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.vendor.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = (rental, action) => {
    setSelected(rental)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'approve') setRentals(rentals.map((r) => r.id === selected.id ? { ...r, status: 'active' } : r))
    if (modalAction === 'remove') setRentals(rentals.filter((r) => r.id !== selected.id))
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
          <p className="text-xs text-textMuted">{row.vendor}</p>
        </div>
      </div>
    )},
    { key: 'category', title: 'Category' },
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
      <Table columns={columns} data={filtered} onRowClick={(row) => window.location.href = `/rentals/${row.id}`} />

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
