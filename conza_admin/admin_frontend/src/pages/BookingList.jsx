import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, CalendarCheck } from 'lucide-react'
import useBookingStore from '../store/bookings/useBookingStore'
import Table from '../components/common/Table'
import StatusBadge from '../components/common/StatusBadge'
import Button from '../components/common/Button'
import SearchBar from '../components/common/SearchBar'
import Select from '../components/common/Select'
import Breadcrumb from '../components/layout/Breadcrumb'

// Format a date-time value to a short readable string, or '—' if absent.
const fmtTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function BookingList() {
  const navigate = useNavigate()
  const { loading, error, filters, setFilters, fetchBookings, bookings } = useBookingStore()

  useEffect(() => {
    fetchBookings()
  }, [])

  // Client-side filter — search across ID, customer name and category
  const filtered = bookings.filter((b) => {
    if (filters.status !== 'all' && b.status !== filters.status) return false
    if (filters.type !== 'all' && b.bookingType !== filters.type) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const matchId       = b.id?.toLowerCase().includes(q)
      const matchCustomer = b.user?.toLowerCase().includes(q)
      const matchCategory = b.category?.toLowerCase().includes(q)
      if (!matchId && !matchCustomer && !matchCategory) return false
    }
    return true
  })

  const columns = [
    {
      key: 'id',
      title: 'Booking ID',
      render: (row) => (
        <span className="font-mono text-xs text-textMuted truncate max-w-[120px] block" title={row.id}>
          {row.id?.slice(-10).toUpperCase()}
        </span>
      ),
    },
    { key: 'user',        title: 'Customer' },
    { key: 'category',   title: 'Category', render: (row) => row.category || '—' },
    {
      key: 'bookingType',
      title: 'Type',
      render: (row) => (
        <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded-full ${
          row.bookingType === 'labour'   ? 'bg-blue-100 text-blue-700'  :
          row.bookingType === 'material' ? 'bg-amber-100 text-amber-700' :
                                          'bg-purple-100 text-purple-700'
        }`}>
          {row.bookingType}
        </span>
      ),
    },
    { key: 'total',  title: 'Total',  render: (row) => `₹${row.total ?? 0}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },

    // ── Time columns ────────────────────────────────────────────────────────
    {
      key: 'createdAt',
      title: 'Booked Time',
      render: (row) => (
        <span className="text-xs text-textSecondary whitespace-nowrap">{fmtTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'workStartTime',
      title: 'Started Time',
      render: (row) => (
        <span className="text-xs text-textSecondary whitespace-nowrap">
          {fmtTime(row.workStartTime || row.checkInTime || (['in_progress', 'completed'].includes(row.status) ? row.acceptedAt : null))}
        </span>
      ),
    },
    {
      key: 'checkOutTime',
      title: 'Completed Time',
      render: (row) => (
        <span className="text-xs text-textSecondary whitespace-nowrap">
          {row.status === 'completed' ? fmtTime(row.checkOutTime || row.updatedAt) : '—'}
        </span>
      ),
    },

    // ── Actions ─────────────────────────────────────────────────────────────
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link to={`/bookings/${row.id}`}>
            <Button variant="ghost" size="sm" title="View details"><Eye size={14} /></Button>
          </Link>
          <Link to={`/bookings/${row.id}/timeline`}>
            <Button variant="ghost" size="sm" title="View timeline"><CalendarCheck size={14} /></Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Bookings' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Bookings</h1>
        <div className="flex items-center gap-3">
          <SearchBar
            placeholder="Search ID, customer, category..."
            onSearch={(q) => setFilters({ ...filters, search: q })}
          />
          <Select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={[
              { value: 'all',      label: 'All Types' },
              { value: 'labour',   label: 'Labour' },
              { value: 'material', label: 'Material' },
              { value: 'rental',   label: 'Rental' },
            ]}
          />
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'all',                            label: 'All Status' },
              { value: 'pending',                        label: 'Pending' },
              { value: 'accepted',                       label: 'Accepted' },
              { value: 'arrived',                        label: 'Arrived' },
              { value: 'in_progress',                    label: 'In Progress' },
              { value: 'awaiting_customer_confirmation', label: 'Awaiting Confirmation' },
              { value: 'completed',                      label: 'Completed' },
              { value: 'cancelled',                      label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-textMuted">Loading bookings...</div>
      ) : error ? (
        <div className="text-center py-12 text-danger">{error}</div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          rowKey="id"
          emptyText="No bookings found"
          onRowClick={(row) => navigate(`/bookings/${row.id}`)}
        />
      )}
    </div>
  )
}
