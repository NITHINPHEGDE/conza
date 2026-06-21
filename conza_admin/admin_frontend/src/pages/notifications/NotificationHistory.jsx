import { useState } from 'react'
import { Bell, Smartphone, MessageSquare, Mail } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockHistory = [
  { id: '1', type: 'push', title: 'New Booking Alert', audience: 'Workers', sent: 342, delivered: 338, failed: 4, date: '2024-06-20T14:00:00Z' },
  { id: '2', type: 'sms', title: 'Order Confirmation', audience: 'Customers', sent: 156, delivered: 154, failed: 2, date: '2024-06-20T13:00:00Z' },
  { id: '3', type: 'email', title: 'Weekly Report', audience: 'Vendors', sent: 89, delivered: 87, failed: 2, date: '2024-06-20T10:00:00Z' },
  { id: '4', type: 'push', title: 'Promotion Alert', audience: 'All Users', sent: 12458, delivered: 12100, failed: 358, date: '2024-06-19T18:00:00Z' },
]

export default function NotificationHistory() {
  const [history] = useState(mockHistory)

  const columns = [
    { key: 'type', title: 'Type', render: (row) => (
      <div className="flex items-center gap-2">
        {row.type === 'push' && <Smartphone size={16} className="text-blue-500" />}
        {row.type === 'sms' && <MessageSquare size={16} className="text-green-500" />}
        {row.type === 'email' && <Mail size={16} className="text-purple-500" />}
        <span className="capitalize">{row.type}</span>
      </div>
    )},
    { key: 'title', title: 'Title' },
    { key: 'audience', title: 'Audience' },
    { key: 'sent', title: 'Sent' },
    { key: 'delivered', title: 'Delivered' },
    { key: 'failed', title: 'Failed' },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Notifications' }, { label: 'History' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Notification History</h1>
      <Table columns={columns} data={history} />
    </div>
  )
}
