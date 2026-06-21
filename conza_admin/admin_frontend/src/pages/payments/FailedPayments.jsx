import { useState } from 'react'
import { XCircle, RefreshCw } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockFailed = [
  { id: 'FP001', customer: 'Ananya R', amount: 960, reason: 'Insufficient funds', retryCount: 2, date: '2024-06-20T12:00:00Z' },
  { id: 'FP002', customer: 'Meena T', amount: 2400, reason: 'Card expired', retryCount: 1, date: '2024-06-19T14:00:00Z' },
]

export default function FailedPayments() {
  const [failed, setFailed] = useState(mockFailed)

  const handleRetry = (id) => {
    setFailed(failed.filter((f) => f.id !== id))
  }

  const columns = [
    { key: 'id', title: 'Failed ID' },
    { key: 'customer', title: 'Customer' },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'reason', title: 'Reason' },
    { key: 'retryCount', title: 'Retries' },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <Button variant="ghost" size="sm" onClick={() => handleRetry(row.id)}><RefreshCw size={14} className="text-accentAmber" /></Button>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Payments' }, { label: 'Failed' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Failed Payments</h1>
      <Table columns={columns} data={failed} />
    </div>
  )
}
