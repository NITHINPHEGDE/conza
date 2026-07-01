import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, CalendarCheck } from 'lucide-react'
import useBookingStore from '../../store/bookings/useBookingStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function BookingList() {
  const { loading, error, filters, setFilters, fetchBookings, getFilteredBookings } = useBookingStore()

  useEffect(() => {
    fetchBookings()
  }, [])

  const filtered = getFilteredBookings()

  const columns = [
    { key: 'id', title: 'Booking ID' },
    { key: 'user', title: 'Customer' },
    { key: 'category', title: 'Category' },
    { key: 'bookingType', title: 'Type', render: (row) => <span className="capitalize">{row.bookingType}</span> },
    { key: 'total', title: 'Total', render: (row) => `₹${row.total}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/bookings/${row.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
        <Link to={`/bookings/${row.id}/timeline`}><Button variant="ghost" size="sm"><CalendarCheck size={14} /></Button></Link>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Bookings' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Bookings</h1>
        <div className="flex items-center gap-3">
          <SearchBar placeholder="Search bookings..." onSearch={(q) => setFilters({ ...filters, search: q })} />
          <Select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'labour', label: 'Labour' },
              { value: 'material', label: 'Material' },
              { value: 'rental', label: 'Rental' },
            ]}
          />
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'arrived', label: 'Arrived' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-textMuted">Loading bookings...</div>
      ) : error ? (
        <div className="text-center py-12 text-danger">{error}</div>
      ) : (
        <Table columns={columns} data={filtered} onRowClick={(row) => window.location.href = `/bookings/${row.id}`} />
      )}
    </div>
  )
}
