import { useState } from 'react'
import { Eye, CheckCircle, MessageSquare } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockTickets = [
  { id: 'TKT001', user: 'Rahul Sharma', type: 'customer', subject: 'App not loading', priority: 'high', status: 'open', date: '2024-06-20T11:00:00Z' },
  { id: 'TKT002', user: 'BuildMart Pro', type: 'vendor', subject: 'Payment not received', priority: 'medium', status: 'in_progress', date: '2024-06-20T10:00:00Z' },
  { id: 'TKT003', user: 'Suresh Kumar', type: 'worker', subject: 'GPS issue', priority: 'low', status: 'resolved', date: '2024-06-19T14:00:00Z' },
]

export default function Tickets() {
  const [tickets, setTickets] = useState(mockTickets)

  const handleResolve = (id) => {
    setTickets(tickets.map((t) => t.id === id ? { ...t, status: 'resolved' } : t))
  }

  const columns = [
    { key: 'id', title: 'Ticket ID' },
    { key: 'user', title: 'User' },
    { key: 'type', title: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'subject', title: 'Subject' },
    { key: 'priority', title: 'Priority', render: (row) => <StatusBadge status={row.priority} label={row.priority} /> },
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
      <Breadcrumb items={[{ label: 'Complaints', path: '/complaints' }, { label: 'Tickets' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Support Tickets</h1>
      <Table columns={columns} data={tickets} />
    </div>
  )
}
