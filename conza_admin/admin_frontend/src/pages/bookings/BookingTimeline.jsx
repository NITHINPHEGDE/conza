import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, Circle } from 'lucide-react'
import { mockBookingTimeline } from '../../mock/bookings'
import Button from '../../components/common/Button/Button'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function BookingTimeline() {
  const { id } = useParams()
  const timeline = mockBookingTimeline.filter((t) => t.bookingId === id)

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Bookings', path: '/bookings' }, { label: 'Timeline' }]} />
      <div className="flex items-center gap-4">
        <Link to={`/bookings/${id}`}><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Booking Timeline</h1>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {timeline.map((event, idx) => (
              <div key={event.id} className="relative flex items-start gap-4 pl-10">
                <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${idx === timeline.length - 1 ? 'bg-accentYellow border-accentYellow' : 'bg-surface border-border'}`}>
                  {idx === timeline.length - 1 ? <CheckCircle size={12} className="text-white" /> : <Circle size={12} className="text-textMuted" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={event.status} />
                    <span className="text-xs text-textMuted">{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-textSecondary">{event.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
