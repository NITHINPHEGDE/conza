import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Store, Phone, Mail, MapPin, Star, Calendar, Wallet, ShoppingCart, FileText } from 'lucide-react'
import useVendorStore from '../../store/vendors/useVendorStore'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function VendorDetails() {
  const { id } = useParams()
  const { vendors, updateVendorStatus } = useVendorStore()
  const vendor = vendors.find((v) => v.id === id)

  if (!vendor) return <div className="text-center py-12 text-textMuted">Vendor not found</div>

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Vendors', path: '/vendors' }, { label: vendor.shopName }]} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/vendors"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
          <h1 className="text-2xl font-bold text-textPrimary">{vendor.shopName}</h1>
          <StatusBadge status={vendor.status} />
        </div>
        <div className="flex gap-2">
          {vendor.status === 'active' ? (
            <Button variant="outline" onClick={() => updateVendorStatus(id, 'suspended')}>Suspend</Button>
          ) : (
            <Button onClick={() => updateVendorStatus(id, 'active')}>Activate</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Store size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Shop Name</p><p className="text-sm font-medium text-textPrimary">{vendor.shopName}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Phone</p><p className="text-sm font-medium text-textPrimary">{vendor.phone}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Email</p><p className="text-sm font-medium text-textPrimary">{vendor.email || 'N/A'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Address</p><p className="text-sm font-medium text-textPrimary">{vendor.address}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">GST</p><p className="text-sm font-medium text-textPrimary">{vendor.gstNumber || 'N/A'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">License</p><p className="text-sm font-medium text-textPrimary">{vendor.licenseNo || 'N/A'}</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-accentAmber" />
                  <span className="text-sm text-textSecondary">Total Orders</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">{vendor.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-green-500" />
                  <span className="text-sm text-textSecondary">Total Revenue</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">₹{(vendor.totalRevenue / 100000).toFixed(1)}L</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-accentYellow" />
                  <span className="text-sm text-textSecondary">Rating</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">{vendor.rating}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <div className="space-y-2">
              <Link to={`/vendors/${id}/orders`}><Button variant="outline" className="w-full justify-start">View Orders</Button></Link>
              <Link to={`/vendors/${id}/earnings`}><Button variant="outline" className="w-full justify-start">Earnings</Button></Link>
              <Link to={`/vendors/${id}/reviews`}><Button variant="outline" className="w-full justify-start">Reviews</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
