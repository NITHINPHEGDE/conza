import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, HardHat, Phone, Mail, MapPin, Star, Calendar, CheckCircle, XCircle, Wallet, Briefcase } from 'lucide-react'
import useWorkerStore from '../../store/workers/useWorkerStore'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function WorkerDetails() {
  const { id } = useParams()
  const { workers, updateWorkerStatus } = useWorkerStore()
  const worker = workers.find((w) => w.id === id)

  if (!worker) return <div className="text-center py-12 text-textMuted">Worker not found</div>

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Workers', path: '/workers' }, { label: worker.fullName }]} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/workers"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
          <h1 className="text-2xl font-bold text-textPrimary">{worker.fullName}</h1>
          <StatusBadge status={worker.status} />
          {worker.isOnline && <StatusBadge status="online" label="Online" />}
        </div>
        <div className="flex gap-2">
          {worker.status === 'active' ? (
            <Button variant="outline" onClick={() => updateWorkerStatus(id, 'suspended')}>Suspend</Button>
          ) : (
            <Button onClick={() => updateWorkerStatus(id, 'active')}>Activate</Button>
          )}
          <Button variant="outline" onClick={() => updateWorkerStatus(id, 'active')}>Force Offline</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <HardHat size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Category</p><p className="text-sm font-medium text-textPrimary">{worker.category}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Phone</p><p className="text-sm font-medium text-textPrimary">{worker.phone}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Email</p><p className="text-sm font-medium text-textPrimary">{worker.email || 'N/A'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Location</p><p className="text-sm font-medium text-textPrimary">{worker.locationText}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Experience</p><p className="text-sm font-medium text-textPrimary">{worker.experience} years</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Star size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Rating</p><p className="text-sm font-medium text-textPrimary">{worker.rating} ({worker.totalJobs} jobs)</p></div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-textMuted mb-1">Bio</p>
              <p className="text-sm text-textSecondary">{worker.bio}</p>
            </div>
            <div className="mt-4">
              <p className="text-xs text-textMuted mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {worker.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-accentYellowSoft rounded-full text-xs font-medium text-accentAmber">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Verification Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(worker.verification).map(([key, value]) => (
                <div key={key} className={`p-4 rounded-lg border ${value ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2">
                    {value ? <CheckCircle size={16} className="text-success" /> : <XCircle size={16} className="text-danger" />}
                    <span className="text-sm font-medium capitalize text-textPrimary">{key}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Earnings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-accentAmber" />
                  <span className="text-sm text-textSecondary">Total Earnings</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">₹{worker.earnings.total.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-500" />
                  <span className="text-sm text-textSecondary">This Month</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">₹{worker.earnings.thisMonth.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surfaceElevated">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-green-500" />
                  <span className="text-sm text-textSecondary">Pending</span>
                </div>
                <span className="text-lg font-bold text-textPrimary">₹{worker.earnings.pending.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <div className="space-y-2">
              <Link to={`/workers/${id}/ratings`}><Button variant="outline" className="w-full justify-start">View Ratings</Button></Link>
              <Link to={`/workers/${id}/earnings`}><Button variant="outline" className="w-full justify-start">Earnings History</Button></Link>
              <Link to={`/workers/tracking`}><Button variant="outline" className="w-full justify-start">Live Tracking</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
