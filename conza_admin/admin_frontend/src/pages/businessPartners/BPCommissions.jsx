import { useParams } from 'react-router-dom'
import Table from '../../components/common/Table/Table'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockCommissions = [
  { id: '1', bpId: '1', source: 'Worker Referral - Suresh Kumar', amount: 500, date: '2024-06-20' },
  { id: '2', bpId: '1', source: 'Vendor Referral - BuildMart Pro', amount: 1200, date: '2024-06-19' },
  { id: '3', bpId: '1', source: 'Worker Referral - Amit Singh', amount: 500, date: '2024-06-18' },
  { id: '4', bpId: '1', source: 'Booking Commission', amount: 75, date: '2024-06-20' },
]

export default function BPCommissions() {
  const { id } = useParams()
  const commissions = mockCommissions.filter((c) => c.bpId === id)

  const columns = [
    { key: 'source', title: 'Source' },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Business Partners', path: '/business-partners' }, { label: 'Commissions' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Commission History</h1>
      <Table columns={columns} data={commissions} />
    </div>
  )
}
