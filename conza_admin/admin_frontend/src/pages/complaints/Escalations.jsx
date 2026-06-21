import { useState } from 'react'
import { Eye, CheckCircle, ArrowUp } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockEscalations = [
  { id: 'ESC001', complaintId: 'C001', user: 'Rahul Sharma', subject: 'Worker did not arrive', escalatedTo: 'Manager', status: 'open', date: '2024-06-20T12:00:00Z' },
  { id: 'ESC002', complaintId: 'C003', user: 'Priya Patel', subject: 'Wrong item delivered', escalatedTo: 'Senior Manager', status: 'in_progress', date: '2024-06-20T11:00:00Z' },
]

export default function Escalations() {
  const [escalations, setEscalations] = useState(mockEscalations)

  const handleResolve = (id) => {
    setEscalations(escalations.map((e) => e.id === id ? { ...e, status: 'resolved' } : e))
  }

  const columns = [
    { key: 'id', title: 'Escalation ID' },
    { key: 'complaintId', title: 'Complaint' },
    { key: 'user', title: 'User' },
    { key: 'subject', title: 'Subject' },
    { key: 'escalatedTo', title: 'Escalated To' },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm"><Eye size={14} /></Button>
        {row.status !== 'resolved' && (
          <Button variant="ghost" size="sm" onClick={() => handleResolve(row.id)}><CheckCircle size={14} className="text-success" /></Button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Complaints', path: '/complaints' }, { label: 'Escalations' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Escalations</h1>
      <Table columns={columns} data={escalations} />
    </div>
  )
}
