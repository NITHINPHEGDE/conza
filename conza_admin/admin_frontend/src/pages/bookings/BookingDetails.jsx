import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, HardHat, MapPin, DollarSign, Clock, FileText } from 'lucide-react'
import bookingService from '../../services/bookingService'
import useBookingStore from '../../store/bookings/useBookingStore'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function BookingDetails() {
  const { id } = useParams()
  const { updateBookingStatus } = useBookingStore()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    bookingService.getById(id).then((res) => {
      const doc = res.booking
      if (doc) {
        setBooking({
          ...doc,
          id: doc._id,
          user: doc.user?.fullName || doc.user?.phone || 'N/A',
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-12 text-textMuted">Loading booking...</div>
  if (!booking) return <div className="text-center py-12 text-textMuted">Booking not found</div>

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Bookings', path: '/bookings' }, { label: booking.id }]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/bookings"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
          <h1 className="text-2xl font-bold text-textPrimary">Booking {booking.id}</h1>
          <StatusBadge status={booking.status} />
        </div>
        <div className="flex gap-2">
          {booking.status === 'pending' && <Button onClick={() => updateBookingStatus(id, 'accepted').then(() => setBooking({ ...booking, status: 'accepted' }))}>Accept</Button>}
          {booking.status === 'accepted' && <Button onClick={() => updateBookingStatus(id, 'in_progress').then(() => setBooking({ ...booking, status: 'in_progress' }))}>Start Job</Button>}
          {booking.status === 'in_progress' && <Button onClick={() => updateBookingStatus(id, 'completed').then(() => setBooking({ ...booking, status: 'completed' }))}>Complete</Button>}
          <Button variant="outline" onClick={() => updateBookingStatus(id, 'cancelled').then(() => setBooking({ ...booking, status: 'cancelled' }))}>Cancel</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Booking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Customer</p><p className="text-sm font-medium text-textPrimary">{booking.user}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <HardHat size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Category</p><p className="text-sm font-medium text-textPrimary">{booking.category}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Address</p><p className="text-sm font-medium text-textPrimary">{booking.houseName} {booking.houseNumber}, {booking.street}, {booking.area}, {booking.city}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Total</p><p className="text-sm font-medium text-textPrimary">₹{booking.total}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-textMuted" />
                <div>
                  <p className="text-xs text-textMuted">Scheduled</p>
                  <p className="text-sm font-medium text-textPrimary">
                    {booking.isImmediate
                      ? 'Immediate'
                      : booking.totalDays > 1 && booking.scheduledEndDate
                        ? `${new Date(booking.scheduledDate).toLocaleDateString()} → ${new Date(booking.scheduledEndDate).toLocaleDateString()} (${booking.totalDays} days)`
                        : new Date(booking.scheduledDate).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-textMuted" />
                <div><p className="text-xs text-textMuted">Payment</p><p className="text-sm font-medium text-textPrimary uppercase">{booking.paymentMethod}</p></div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-textMuted mb-1">Description</p>
              <p className="text-sm text-textSecondary">{booking.description}</p>
            </div>
            {booking.notes && (
              <div className="mt-4">
                <p className="text-xs text-textMuted mb-1">Notes</p>
                <p className="text-sm text-textSecondary">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Financials</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-textSecondary">Subtotal</span>
                <span className="font-medium text-textPrimary">₹{booking.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-textSecondary">Platform Fee</span>
                <span className="font-medium text-textPrimary">₹{booking.platformFee}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-sm font-semibold">
                <span className="text-textPrimary">Total</span>
                <span className="text-textPrimary">₹{booking.total}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <div className="space-y-2">
              <Link to={`/bookings/${id}/timeline`}><Button variant="outline" className="w-full justify-start">View Timeline</Button></Link>
              <Button variant="outline" className="w-full justify-start">Assign Worker</Button>
              <Button variant="outline" className="w-full justify-start">Reassign Worker</Button>
              <Button variant="outline" className="w-full justify-start text-danger">Resolve Dispute</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
