import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react'
import bookingService from '../services/bookingService'
import Button from '../components/common/Button'
import StatusBadge from '../components/common/StatusBadge'
import Breadcrumb from '../components/layout/Breadcrumb'

// Build a timeline from the timestamps stored on the booking document.
// The Booking model has no separate statusHistory collection, so we derive
// each step from the individual date fields in the correct status order.
function buildTimeline(booking) {
  const events = []

  const push = (status, timestamp, note) => {
    if (timestamp) events.push({ status, timestamp: new Date(timestamp), note })
  }

  push('pending',   booking.createdAt,    'Booking created')
  push('accepted',  booking.acceptedAt,   'Booking accepted' + (booking.workerSnapshot?.[0]?.name ? ` – ${booking.workerSnapshot[0].name}` : ''))
  push('arrived',   booking.checkInTime,  'Worker arrived at location')
  push('in_progress', booking.workStartTime || (booking.checkInTime ? booking.checkInTime : null), 'Work started')
  push('awaiting_customer_confirmation', booking.checkOutTime, 'Worker marked work as complete – awaiting customer confirmation')
  push('completed', booking.status === 'completed' ? (booking.updatedAt || booking.checkOutTime) : null, 'Work completed')
  push('cancelled', booking.status === 'cancelled' ? (booking.updatedAt) : null, 'Booking cancelled')

  // Remove duplicates caused by the same timestamp (e.g. arrived === in_progress) and nulls
  return events
    .filter((e) => e.timestamp)
    .sort((a, b) => a.timestamp - b.timestamp)
    // Deduplicate adjacent identical statuses
    .filter((e, i, arr) => i === 0 || e.status !== arr[i - 1].status)
}

export default function BookingTimeline() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    bookingService.getById(id)
      .then((res) => {
        const doc = res.booking
        if (!doc) throw new Error('Booking not found')
        setBooking(doc)
      })
      .catch((err) => setError(err.message || 'Failed to load booking'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-textMuted">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading timeline...</span>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Bookings', path: '/bookings' }, { label: 'Timeline' }]} />
        <div className="flex items-center gap-4">
          <Link to="/bookings"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
          <h1 className="text-2xl font-bold text-textPrimary">Booking Timeline</h1>
        </div>
        <div className="bg-surface rounded-xl border border-border p-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle size={32} className="text-danger" />
          <p className="text-textSecondary">{error || 'Booking not found.'}</p>
          <Link to="/bookings"><Button variant="outline">Back to Bookings</Button></Link>
        </div>
      </div>
    )
  }

  const timeline = buildTimeline(booking)
  const bookingLabel = booking._id?.toString().slice(-8).toUpperCase() || id

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Bookings', path: '/bookings' }, { label: bookingLabel, path: `/bookings/${id}` }, { label: 'Timeline' }]} />
      <div className="flex items-center gap-4">
        <Link to={`/bookings/${id}`}><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Booking Timeline</h1>
          <p className="text-sm text-textMuted mt-0.5">#{bookingLabel} · {booking.category || booking.bookingType}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle size={28} className="text-textMuted" />
            <p className="text-textSecondary text-sm">No timeline events found for this booking.</p>
            <p className="text-textMuted text-xs">Timeline is built from status timestamps. This booking may not have progressed yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-border" />
            <div className="space-y-6">
              {timeline.map((event, idx) => {
                const isLast = idx === timeline.length - 1
                return (
                  <div key={idx} className="relative flex items-start gap-4 pl-10">
                    {/* Status dot */}
                    <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 ${
                      isLast
                        ? 'bg-accentYellow border-accentYellow'
                        : 'bg-surface border-border'
                    }`}>
                      {isLast
                        ? <CheckCircle size={12} className="text-white" />
                        : <Circle size={10} className="text-textMuted" />
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <StatusBadge status={event.status} />
                        <span className="text-xs text-textMuted">
                          {event.timestamp.toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-textSecondary">{event.note}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick summary card */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-base font-semibold text-textPrimary mb-4">Key Timestamps</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Created',          value: booking.createdAt },
            { label: 'Accepted',         value: booking.acceptedAt },
            { label: 'Worker Arrived',   value: booking.checkInTime },
            { label: 'Work Started',     value: booking.workStartTime },
            { label: 'Work Ended',       value: booking.checkOutTime },
            { label: 'Last Updated',     value: booking.updatedAt },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-textMuted font-medium">{label}</span>
              <span className="text-sm text-textPrimary font-semibold">
                {value
                  ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : <span className="text-textMuted font-normal">—</span>
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
