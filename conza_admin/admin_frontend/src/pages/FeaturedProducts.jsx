import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Table from '../components/common/Table'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Breadcrumb from '../components/layout/Breadcrumb'
import useMaterialStore from '../store/materials/useMaterialStore'

export default function FeaturedProducts({ embedded = false }) {
  const { featured, fetchFeatured, toggleFeatured, featuredLoading, featuredError } = useMaterialStore()
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    fetchFeatured()
  }, [])

  const handleRemove = async () => {
    if (!removeTarget) return
    try {
      setRemoving(true)
      await toggleFeatured(removeTarget.id)
    } finally {
      setRemoving(false)
      setRemoveTarget(null)
    }
  }

  const columns = [
    { key: 'title', title: 'Product' },
    { key: 'vendor', title: 'Vendor' },
    { key: 'category', title: 'Category' },
    { key: 'price', title: 'Price', render: (row) => `₹${row.price}` },
    { key: 'featuredSince', title: 'Featured Since', render: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—' },
    { key: 'actions', title: 'Actions', render: (row) => (
      <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(row)}><Trash2 size={14} className="text-danger" /></Button>
    )},
  ]

  return (
    <div className="space-y-4">
      {!embedded && <Breadcrumb items={[{ label: 'Materials', path: '/materials' }, { label: 'Featured' }]} />}
      {embedded
        ? <h2 className="text-lg font-semibold text-textPrimary">Featured Products</h2>
        : <h1 className="text-2xl font-bold text-textPrimary">Featured Products</h1>}

      {featuredLoading && <p className="text-sm text-textMuted">Loading featured products...</p>}
      {!featuredLoading && featuredError && <p className="text-sm text-danger">{featuredError}</p>}
      {!featuredLoading && !featuredError && (
        <Table columns={columns} data={featured} emptyText="No featured products yet" />
      )}

      <Modal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove from Featured"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRemove} disabled={removing}>
              {removing ? 'Removing...' : 'Remove'}
            </Button>
          </>
        }
      >
        <p className="text-textSecondary">
          Remove <strong>{removeTarget?.title}</strong> from featured products?
        </p>
      </Modal>
    </div>
  )
}
