import { useState } from 'react'
import { Banknote } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockCash = [
  { id: 'CASH001', customer: 'Ananya R', worker: 'Ravi Kumar', amount: 960, status: 'collected', date: '2024-06-20T14:00:00Z' },
  { id: 'CASH002', customer: 'Meena T', worker: 'Suresh Kumar', amount: 535, status: 'pending', date: '2024-06-20T10:00:00Z' },
]

export default function CashPayments() {
  const [payments] = useState(mockCash)
  const [search, setSearch] = useState('')

  const filtered = payments.filter((p) => 
    p.customer.toLowerCase().includes(search.toLowerCase()) || 
    p.worker.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'id', title: 'Cash ID' },
    { key: 'customer', title: 'Customer' },
    { key: 'worker', title: 'Worker' },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} label={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Payments' }, { label: 'Cash' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Cash Payments</h1>
        <SearchBar placeholder="Search..." onSearch={setSearch} />
      </div>
      <Table columns={columns} data={filtered} />
    </div>
  )
}
