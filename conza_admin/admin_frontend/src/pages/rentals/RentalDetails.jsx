import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Truck, Store, Tag, DollarSign, Box, Shield } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockRentals = [
  { id: '1', title: 'Concrete Mixer', vendor: 'RentEquip Bangalore', category: 'Equipment', price: 800, stock: 3, status: 'active', deposit: 5000, minRentalDays: 1, description: 'Heavy duty concrete mixer for construction sites' },
]

export default function RentalDetails() {
  const { id } = useParams()
  const rental = mockRentals.find((r) => r.id === id)

  if (!rental) return <div className="text-center py-12 text-textMuted">Rental not found</div>

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
            <p className="text-sm text-textSecondary">{rental.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">Edit Rental</Button>
              <Button variant="outline" className="w-full justify-start text-danger">Remove Listing</Button>
              <Button variant="outline" className="w-full justify-start">Feature Rental</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
