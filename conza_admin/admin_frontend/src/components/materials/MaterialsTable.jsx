import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, CheckCircle, XCircle, Package, BookPlus } from 'lucide-react'
import useMaterialStore from '../../store/materials/useMaterialStore'
import Table from '../common/Table'
import StatusBadge from '../common/StatusBadge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import SearchBar from '../common/SearchBar'
import AddToCatalogueModal from './AddToCatalogueModal'

// Renders vendor product listings. `source` controls which subset is fetched:
//  - 'all'    every vendor listing (materials & rentals aside — type='material' only)
//  - 'custom' only listings the vendor created themselves (no Conza Catalogue link)
export default function MaterialsTable({ source = 'all' }) {
  const { materials, fetchMaterials, updateMaterial, deleteMaterial, loading, error } = useMaterialStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [catalogueTarget, setCatalogueTarget] = useState(null)

  useEffect(() => {
    fetchMaterials({ source })
  }, [source])

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

  const handleCatalogueSuccess = () => {
    // The linked listing is now catalogue-sourced, so refresh this view —
    // it drops out of "Custom Products" and its badge updates in "All Products".
    fetchMaterials({ source })
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
    ...(source === 'all' ? [{ key: 'source', title: 'Source', render: (row) => (
      row.source === 'catalogue'
        ? <StatusBadge status="confirmed" label="Catalogue" />
        : <StatusBadge status="pending" label="Custom" />
    )}] : []),
    { key: 'price', title: 'Price', render: (row) => `₹${row.price}` },
    { key: 'stock', title: 'Stock' },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        {row.source === 'custom' && (
          <Button variant="outline" size="sm" onClick={() => setCatalogueTarget(row)}>
            <BookPlus size={14} /> Add to Catalogue
          </Button>
        )}
        <Link to={`/materials/${row.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'approve')}><CheckCircle size={14} className="text-success" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'remove')}><XCircle size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <SearchBar
          placeholder={source === 'custom' ? 'Search custom products...' : 'Search products...'}
          onSearch={setSearch}
        />
      </div>

      {loading && <p className="text-sm text-textMuted">Loading products...</p>}
      {!loading && error && <p className="text-sm text-danger">{error}</p>}
      {!loading && !error && (
        <Table
          columns={columns}
          data={filtered}
          onRowClick={(row) => navigate(`/materials/${row.id}`)}
          emptyText={source === 'custom' ? 'No custom vendor products found' : 'No products found'}
        />
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

      {catalogueTarget && (
        <AddToCatalogueModal
          material={catalogueTarget}
          onClose={() => setCatalogueTarget(null)}
          onSuccess={handleCatalogueSuccess}
        />
      )}
    </div>
  )
}
