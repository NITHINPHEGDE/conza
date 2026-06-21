import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, CheckCircle, XCircle, Package } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockMaterials = [
  { id: '1', title: 'Portland Cement 50kg', vendor: 'BuildMart Pro', category: 'Cement', price: 380, stock: 45, status: 'active', type: 'material' },
  { id: '2', title: 'TMT Steel Bars 12mm', vendor: 'SteelWorld India', category: 'Steel', price: 62, stock: 120, status: 'active', type: 'material' },
  { id: '3', title: 'AAC Blocks 600×200×150', vendor: 'QuickBuild Supply', category: 'Blocks', price: 45, stock: 0, status: 'out_of_stock', type: 'material' },
  { id: '4', title: 'River Sand (Fine)', vendor: 'NatureMats Co.', category: 'Sand', price: 1200, stock: 8, status: 'low_stock', type: 'material' },
  { id: '5', title: 'Concrete Mixer Rental', vendor: 'RentEquip Bangalore', category: 'Equipment', price: 800, stock: 3, status: 'active', type: 'rental' },
]

export default function MaterialList() {
  const [materials, setMaterials] = useState(mockMaterials)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  const filtered = materials.filter((m) => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.vendor.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = (mat, action) => {
    setSelected(mat)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'approve') setMaterials(materials.map((m) => m.id === selected.id ? { ...m, status: 'active' } : m))
    if (modalAction === 'reject') setMaterials(materials.map((m) => m.id === selected.id ? { ...m, status: 'rejected' } : m))
    if (modalAction === 'remove') setMaterials(materials.filter((m) => m.id !== selected.id))
    setModalOpen(false)
  }

  const columns = [
    { key: 'title', title: 'Product', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <Package size={14} className="text-amber-700" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.title}</p>
          <p className="text-xs text-textMuted">{row.vendor}</p>
        </div>
      </div>
    )},
    { key: 'category', title: 'Category' },
    { key: 'price', title: 'Price', render: (row) => `₹${row.price}` },
    { key: 'stock', title: 'Stock' },
    { key: 'type', title: 'Type', render: (row) => <StatusBadge status={row.type} label={row.type} /> },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/materials/${row.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'approve')}><CheckCircle size={14} className="text-success" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'remove')}><XCircle size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Materials' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Materials & Products</h1>
        <SearchBar placeholder="Search materials..." onSearch={setSearch} />
      </div>
      <Table columns={columns} data={filtered} onRowClick={(row) => window.location.href = `/materials/${row.id}`} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction.charAt(0).toUpperCase() + modalAction.slice(1)} Product`}
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
