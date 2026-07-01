import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, CheckCircle, XCircle, Package } from 'lucide-react'
import useMaterialStore from '../../store/materials/useMaterialStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function MaterialList() {
  const { materials, fetchMaterials, updateMaterial, deleteMaterial, loading, error } = useMaterialStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  useEffect(() => {
    fetchMaterials()
  }, [])

  const filtered = materials.filter((m) =>
    m.title?.toLowerCase().includes(search.toLowerCase()) ||
    m.vendor?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = (mat, action) => {
    setSelected(mat)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = async () => {
    if (modalAction === 'approve') await updateMaterial(selected.id, { isAvailable: true })
    if (modalAction === 'remove') await deleteMaterial(selected.id)
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
    { key: 'price', title: 'Price', render: (row) => `₹${row.price}` },
    { key: 'stock', title: 'Stock' },
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

      {loading && <p className="text-sm text-textMuted">Loading materials...</p>}
      {!loading && error && <p className="text-sm text-danger">{error}</p>}
      {!loading && !error && (
        <Table columns={columns} data={filtered} onRowClick={(row) => navigate(`/materials/${row.id}`)} />
      )}

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
