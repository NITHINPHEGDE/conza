import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import customerService from '../../services/customerService'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function CustomerBookings() {
  const { id } = useParams()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await customerService.getBookings(id)
        if (res.success) {
          setBookings((res.bookings || res.data?.bookings || []).map((b) => ({ ...b, id: b._id || b.id })))
        } else {
          setError(res.message || 'Failed to load bookings')
        }
      } catch (err) {
        setError('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const columns = [
    { key: 'id', title: 'Booking ID', render: (row) => <span className="text-xs text-textMuted">{row.id}</span> },
    { key: 'category', title: 'Category' },
    { key: 'bookingType', title: 'Type', render: (row) => <span className="capitalize">{row.bookingType}</span> },
    { key: 'total', title: 'Total', render: (row) => `₹${row.total}` },
    { key: 'scheduled', title: 'Scheduled', render: (row) => {
      if (row.isImmediate) return 'Immediate'
      if (!row.scheduledDate) return '-'
      const start = new Date(row.scheduledDate).toLocaleDateString()
      if (row.totalDays > 1 && row.scheduledEndDate) {
        return `${start} → ${new Date(row.scheduledEndDate).toLocaleDateString()} (${row.totalDays}d)`
      }
      return start
    }},
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'createdAt', title: 'Date', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-' },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Customers', path: '/customers' }, { label: 'Bookings' }]} />
      <div className="flex items-center gap-4">
        <Link to={`/customers/${id}`}><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Customer Bookings</h1>
      </div>

      {loading && <p className="text-sm text-textMuted">Loading bookings...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {!loading && !error && bookings.length === 0 && (
        <p className="text-sm text-textMuted">No bookings found for this customer.</p>
      )}
      {!loading && !error && bookings.length > 0 && (
        <Table columns={columns} data={bookings} onRowClick={(row) => window.location.href = `/bookings/${row.id}`} />
      )}
    </div>
  )
}
