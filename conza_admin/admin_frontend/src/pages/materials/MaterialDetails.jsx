import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Store, Tag, Box, DollarSign, FileText } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockMaterials = [
  { id: '1', title: 'Portland Cement 50kg', vendor: 'BuildMart Pro', category: 'Cement', price: 380, stock: 45, status: 'active', type: 'material', description: 'High quality Portland cement for construction', unit: 'per bag', sku: 'CEM-50-001', hsnCode: '2523' },
]

export default function MaterialDetails() {
  const { id } = useParams()
  const material = mockMaterials.find((m) => m.id === id)

  if (!material) return <div className="text-center py-12 text-textMuted">Material not found</div>

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
              <div><p className="text-xs text-textMuted">SKU</p><p className="text-sm font-medium text-textPrimary">{material.sku}</p></div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-textMuted mb-1">Description</p>
            <p className="text-sm text-textSecondary">{material.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">Edit Product</Button>
              <Button variant="outline" className="w-full justify-start text-danger">Remove Listing</Button>
              <Button variant="outline" className="w-full justify-start">Feature Product</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
