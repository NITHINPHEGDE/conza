import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, MapPin, Phone, Mail, Calendar, Wallet, ShoppingCart, CalendarCheck, AlertTriangle } from 'lucide-react'
import useCustomerStore from '../../store/customers/useCustomerStore'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function CustomerDetails() {
  const { id } = useParams()
  const { customers, updateCustomerStatus } = useCustomerStore()
  const customer = customers.find((c) => c.id === id)

  if (!customer) return <div className="text-center py-12 text-textMuted">Customer not found</div>

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Customers', path: '/customers' }, { label: customer.fullName }]} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/customers">
            <Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button>
          </Link>
          <h1 className="text-2xl font-bold text-textPrimary">{customer.fullName}</h1>
          <StatusBadge status={customer.status} />
        </div>
        <div className="flex gap-2">
          {customer.status === 'active' ? (
            <Button variant="outline" onClick={() => updateCustomerStatus(id, 'suspended')}>Suspend</Button>
          ) : (
            <Button onClick={() => updateCustomerStatus(id, 'active')}>Activate</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User size={18} className="text-textMuted" />
                <div>
                  <p className="text-xs text-textMuted">Full Name</p>
                  <p className="text-sm font-medium text-textPrimary">{customer.fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-textMuted" />
                <div>
                  <p className="text-xs text-textMuted">Phone</p>
                  <p className="text-sm font-medium text-textPrimary">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-textMuted" />
                <div>
                  <p className="text-xs text-textMuted">Email</p>
                  <p className="text-sm font-medium text-textPrimary">{customer.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-textMuted" />
                <div>
                  <p className="text-xs text-textMuted">Location</p>
                  <p className="text-sm font-medium text-textPrimary">{customer.locationText}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-textMuted" />
                <div>
                  <p className="text-xs text-textMuted">Member Since</p>
                  <p className="text-sm font-medium text-textPrimary">{customer.memberSince}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wallet size={18} className="text-textMuted" />
                <div>
                  <p className="text-xs text-textMuted">Wallet Balance</p>
                  <p className="text-sm font-medium text-textPrimary">₹{customer.walletBalance}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Saved Addresses</h3>
            {customer.savedAddresses.length === 0 ? (
              <p className="text-sm text-textMuted">No saved addresses</p>
            ) : (
              <div className="space-y-3">
                {customer.savedAddresses.map((addr, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-surfaceElevated">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className="text-accentAmber" />
                      <span className="text-sm font-medium text-textPrimary">{addr.label}</span>
                    </div>
                    <p className="text-sm text-textSecondary">{addr.address}</p>
                    <p className="text-xs text-textMuted">{addr.city} - {addr.pincode}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <CalendarCheck size={16} className="text-accentAmber" />
                  <span className="text-sm text-textSecondary">Total Bookings</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">{customer.totalBookings}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-blue-500" />
                  <span className="text-sm text-textSecondary">Total Orders</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">{customer.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-green-500" />
                  <span className="text-sm text-textSecondary">Wallet</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">₹{customer.walletBalance}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <div className="space-y-2">
              <Link to={`/customers/${id}/bookings`}>
                <Button variant="outline" className="w-full justify-start">View Bookings</Button>
              </Link>
              <Link to={`/customers/${id}/payments`}>
                <Button variant="outline" className="w-full justify-start">Payment History</Button>
              </Link>
              <Link to={`/customers/${id}/complaints`}>
                <Button variant="outline" className="w-full justify-start">Complaints</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
