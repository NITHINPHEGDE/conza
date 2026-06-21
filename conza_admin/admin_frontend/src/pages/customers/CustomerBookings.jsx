import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { mockCustomerBookings } from '../../mock/customers'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function CustomerBookings() {
  const { id } = useParams()
  const bookings = mockCustomerBookings.filter((b) => b.customerId === id)

  const columns = [
    { key: 'id', title: 'Booking ID' },
    { key: 'worker', title: 'Worker' },
    { key: 'category', title: 'Category' },
    { key: 'total', title: 'Total', render: (row) => `₹${row.total}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Customers', path: '/customers' }, { label: 'Bookings' }]} />
      <div className="flex items-center gap-4">
        <Link to={`/customers/${id}`}><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Customer Bookings</h1>
      </div>
      <Table columns={columns} data={bookings} onRowClick={(row) => window.location.href = `/bookings/${row.id}`} />
    </div>
  )
}
