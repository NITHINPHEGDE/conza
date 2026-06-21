import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { mockVendorOrders } from '../../mock/vendors'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function VendorOrders() {
  const { id } = useParams()
  const orders = mockVendorOrders.filter((o) => o.vendorId === id)

  const columns = [
    { key: 'id', title: 'Order ID' },
    { key: 'customer', title: 'Customer' },
    { key: 'total', title: 'Total', render: (row) => `₹${row.total}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Vendors', path: '/vendors' }, { label: 'Orders' }]} />
      <div className="flex items-center gap-4">
        <Link to={`/vendors/${id}`}><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Vendor Orders</h1>
      </div>
      <Table columns={columns} data={orders} onRowClick={(row) => window.location.href = `/orders/${row.id}`} />
    </div>
  )
}
