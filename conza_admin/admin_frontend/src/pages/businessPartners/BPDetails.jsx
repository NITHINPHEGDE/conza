import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Handshake, Phone, Mail, MapPin, Users, Store, Gift, Wallet } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockBPs = [
  { id: '1', name: 'Vijay Enterprises', phone: '+91 9876543230', email: 'vijay@enterprises.com', territory: 'Bangalore North', workersOnboarded: 45, vendorsOnboarded: 12, referrals: 89, commission: 45000, status: 'active', address: '45, MG Road, Bangalore' },
]

export default function BPDetails() {
  const { id } = useParams()
  const bp = mockBPs.find((b) => b.id === id)

  if (!bp) return <div className="text-center py-12 text-textMuted">Business Partner not found</div>

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Business Partners', path: '/business-partners' }, { label: bp.name }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/business-partners"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
          <h1 className="text-2xl font-bold text-textPrimary">{bp.name}</h1>
          <StatusBadge status={bp.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Partner Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Handshake size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Name</p><p className="text-sm font-medium text-textPrimary">{bp.name}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Phone</p><p className="text-sm font-medium text-textPrimary">{bp.phone}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Email</p><p className="text-sm font-medium text-textPrimary">{bp.email}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-textMuted" />
              <div><p className="text-xs text-textMuted">Territory</p><p className="text-sm font-medium text-textPrimary">{bp.territory}</p></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-accentAmber" />
                  <span className="text-sm text-textSecondary">Workers Onboarded</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">{bp.workersOnboarded}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-blue-500" />
                  <span className="text-sm text-textSecondary">Vendors Onboarded</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">{bp.vendorsOnboarded}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <Gift size={16} className="text-green-500" />
                  <span className="text-sm text-textSecondary">Referrals</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">{bp.referrals}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-purple-500" />
                  <span className="text-sm text-textSecondary">Commission</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">₹{bp.commission.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <div className="space-y-2">
              <Link to={`/business-partners/${id}/referrals`}><Button variant="outline" className="w-full justify-start">View Referrals</Button></Link>
              <Link to={`/business-partners/${id}/commissions`}><Button variant="outline" className="w-full justify-start">Commission History</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
