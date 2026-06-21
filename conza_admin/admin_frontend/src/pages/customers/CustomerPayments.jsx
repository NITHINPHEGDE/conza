import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { mockCustomerPayments } from '../../mock/customers'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function CustomerPayments() {
  const { id } = useParams()
  const payments = mockCustomerPayments.filter((p) => p.customerId === id)

  const columns = [
    { key: 'id', title: 'Payment ID' },
    { key: 'type', title: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'method', title: 'Method', render: (row) => <span className="uppercase">{row.method}</span> },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Customers', path: '/customers' }, { label: 'Payments' }]} />
      <div className="flex items-center gap-4">
        <Link to={`/customers/${id}`}><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Payment History</h1>
      </div>
      <Table columns={columns} data={payments} />
    </div>
  )
}
