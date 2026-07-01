import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Package, Store, Tag, Box, DollarSign, FileText, Star } from 'lucide-react'
import useMaterialStore from '../../store/materials/useMaterialStore'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Modal from '../../components/common/Modal/Modal'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function MaterialDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedMaterial: material, fetchMaterialById, updateMaterial, deleteMaterial, toggleFeatured, loading, error } = useMaterialStore()
  const [editOpen, setEditOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [form, setForm] = useState(null)

  useEffect(() => {
    fetchMaterialById(id)
  }, [id])

  useEffect(() => {
    if (material) {
      setForm({
        title: material.title || '',
        category: material.category || '',
        price: material.price ?? 0,
        stock: material.stock ?? 0,
        unit: material.unit || '',
        sku: material.sku || '',
        hsnCode: material.hsnCode || '',
        description: material.description || '',
      })
    }
  }, [material])

  if (loading) return <div className="text-center py-12 text-textMuted">Loading material...</div>
  if (error || !material) return <div className="text-center py-12 text-textMuted">Material not found</div>

  const handleSave = async () => {
    const res = await updateMaterial(id, form)
    if (res.success) setEditOpen(false)
  }

  const handleRemove = async () => {
    const res = await deleteMaterial(id)
    if (res.success) navigate('/materials')
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Materials', path: '/materials' }, { label: material.title }]} />
      <div className="flex items-center gap-4">
        <Link to="/materials"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">{material.title}</h1>
        <StatusBadge status={material.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Product Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Package size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Product</p><p className="text-sm font-medium text-textPrimary">{material.title}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Store size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Vendor</p><p className="text-sm font-medium text-textPrimary">{material.vendor}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Tag size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Category</p><p className="text-sm font-medium text-textPrimary">{material.category}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Price</p><p className="text-sm font-medium text-textPrimary">₹{material.price} {material.unit}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Box size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Stock</p><p className="text-sm font-medium text-textPrimary">{material.stock} units</p></div>
            </div>
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">SKU</p><p className="text-sm font-medium text-textPrimary">{material.sku || '—'}</p></div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-textMuted mb-1">Description</p>
            <p className="text-sm text-textSecondary">{material.description || '—'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => setEditOpen(true)}>Edit Product</Button>
              <Button variant="outline" className="w-full justify-start text-danger" onClick={() => setRemoveOpen(true)}>Remove Listing</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => toggleFeatured(id)}>
                <Star size={14} className={material.isFeatured ? 'fill-accentAmber text-accentAmber' : ''} />
                {material.isFeatured ? 'Unfeature Product' : 'Feature Product'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Product"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <Input label="HSN Code" value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-textSecondary mb-1.5">Description</label>
              <textarea
                className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove Listing"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoveOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleRemove}>Remove</Button>
          </>
        }
      >
        <p className="text-textSecondary">Are you sure you want to remove <strong>{material.title}</strong>? This deletes the listing for the vendor and customers too.</p>
      </Modal>
    </div>
  )
}
