import { useParams } from 'react-router-dom'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockReferrals = [
  { id: '1', bpId: '1', name: 'Suresh Kumar', type: 'worker', date: '2024-06-20', status: 'active' },
  { id: '2', bpId: '1', name: 'BuildMart Pro', type: 'vendor', date: '2024-06-19', status: 'active' },
  { id: '3', bpId: '1', name: 'Amit Singh', type: 'worker', date: '2024-06-18', status: 'active' },
  { id: '4', bpId: '1', name: 'QuickBuild Supply', type: 'vendor', date: '2024-06-17', status: 'active' },
]

export default function BPReferrals() {
  const { id } = useParams()
  const referrals = mockReferrals.filter((r) => r.bpId === id)

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'type', title: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Business Partners', path: '/business-partners' }, { label: 'Referrals' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">BP Referrals</h1>
      <Table columns={columns} data={referrals} />
    </div>
  )
}
