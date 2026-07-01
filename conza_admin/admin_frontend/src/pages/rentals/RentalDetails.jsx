import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Truck, Store, Tag, DollarSign, Box, Shield, Star } from 'lucide-react'
import useRentalStore from '../../store/rentals/useRentalStore'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Modal from '../../components/common/Modal/Modal'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function RentalDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedRental: rental, fetchRentalById, updateRental, deleteRental, toggleFeatured, loading, error } = useRentalStore()
  const [editOpen, setEditOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [form, setForm] = useState(null)

  useEffect(() => {
    fetchRentalById(id)
  }, [id])

  useEffect(() => {
    if (rental) {
      setForm({
        title: rental.title || '',
        category: rental.category || '',
        price: rental.price ?? 0,
        deposit: rental.deposit ?? 0,
        minRentalDays: rental.minRentalDays ?? 1,
        stock: rental.stock ?? 0,
        description: rental.description || '',
      })
    }
  }, [rental])

  if (loading) return <div className="text-center py-12 text-textMuted">Loading rental...</div>
  if (error || !rental) return <div className="text-center py-12 text-textMuted">Rental not found</div>

  const handleSave = async () => {
    const res = await updateRental(id, form)
    if (res.success) setEditOpen(false)
  }

  const handleRemove = async () => {
    const res = await deleteRental(id)
    if (res.success) navigate('/rentals')
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Rentals', path: '/rentals' }, { label: rental.title }]} />
      <div className="flex items-center gap-4">
        <Link to="/rentals"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">{rental.title}</h1>
        <StatusBadge status={rental.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Rental Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Truck size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Item</p><p className="text-sm font-medium text-textPrimary">{rental.title}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Store size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Vendor</p><p className="text-sm font-medium text-textPrimary">{rental.vendor}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Tag size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Category</p><p className="text-sm font-medium text-textPrimary">{rental.category}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Price/Day</p><p className="text-sm font-medium text-textPrimary">₹{rental.price}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Deposit</p><p className="text-sm font-medium text-textPrimary">₹{rental.deposit}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Box size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Available</p><p className="text-sm font-medium text-textPrimary">{rental.stock} units</p></div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-textMuted mb-1">Description</p>
            <p className="text-sm text-textSecondary">{rental.description || '—'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => setEditOpen(true)}>Edit Rental</Button>
              <Button variant="outline" className="w-full justify-start text-danger" onClick={() => setRemoveOpen(true)}>Remove Listing</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => toggleFeatured(id)}>
                <Star size={14} className={rental.isFeatured ? 'fill-accentAmber text-accentAmber' : ''} />
                {rental.isFeatured ? 'Unfeature Rental' : 'Feature Rental'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Rental"
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
            <Input label="Price/Day" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input label="Deposit" type="number" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
            <Input label="Min Rental Days" type="number" value={form.minRentalDays} onChange={(e) => setForm({ ...form, minRentalDays: e.target.value })} />
            <Input label="Available Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
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
        <p className="text-textSecondary">Are you sure you want to remove <strong>{rental.title}</strong>? This deletes the listing for the vendor and customers too.</p>
      </Modal>
    </div>
  )
}
