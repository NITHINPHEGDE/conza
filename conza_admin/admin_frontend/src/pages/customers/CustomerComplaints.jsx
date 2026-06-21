import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { mockCustomerComplaints } from '../../mock/customers'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function CustomerComplaints() {
  const { id } = useParams()
  const complaints = mockCustomerComplaints.filter((c) => c.customerId === id)

  const columns = [
    { key: 'id', title: 'Complaint ID' },
    { key: 'subject', title: 'Subject' },
    { key: 'priority', title: 'Priority', render: (row) => <StatusBadge status={row.priority} label={row.priority} /> },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Customers', path: '/customers' }, { label: 'Complaints' }]} />
      <div className="flex items-center gap-4">
        <Link to={`/customers/${id}`}><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Complaints</h1>
      </div>
      <Table columns={columns} data={complaints} />
    </div>
  )
}
