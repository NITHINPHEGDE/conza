import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, CalendarCheck } from 'lucide-react'
import useBookingStore from '../../store/bookings/useBookingStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function LabourBookings() {
  const { getBookingsByType } = useBookingStore()
  const [filters, setFilters] = useState({ status: 'all', search: '' })
  const bookings = getBookingsByType('labour')

  const filtered = bookings.filter((b) => {
    if (filters.status !== 'all' && b.status !== filters.status) return false
    if (filters.search && !b.id.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const columns = [
    { key: 'id', title: 'Booking ID' },
    { key: 'user', title: 'Customer' },
    { key: 'category', title: 'Category' },
    { key: 'bookingType', title: 'Type', render: (row) => row.bookingType },
    { key: 'total', title: 'Total', render: (row) => `₹${row.total}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <Button size="sm" variant="ghost" onClick={() => window.location.href = `/bookings/${row.id}`}>
        <Eye size={16} />
      </Button>
    )},
  ]

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Operations' }, { label: 'Bookings' }, { label: 'Labour' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-textPrimary flex items-center gap-2">
          <CalendarCheck size={24} className="text-accentAmber" />
          Labour Bookings
        </h1>
      </div>
      <div className="flex gap-3">
        <SearchBar placeholder="Search bookings..." onSearch={(q) => setFilters({ ...filters, search: q })} />
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
      <Table columns={columns} data={filtered} />
    </div>
  )
}