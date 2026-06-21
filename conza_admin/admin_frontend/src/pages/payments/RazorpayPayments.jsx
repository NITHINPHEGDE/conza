import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockPayments = [
  { id: 'RZP001', customer: 'Rahul Sharma', amount: 750, status: 'success', method: 'card', date: '2024-06-20T14:00:00Z' },
  { id: 'RZP002', customer: 'Priya Patel', amount: 3200, status: 'success', method: 'upi', date: '2024-06-20T13:00:00Z' },
  { id: 'RZP003', customer: 'Ananya R', amount: 960, status: 'failed', method: 'card', date: '2024-06-20T12:00:00Z' },
  { id: 'RZP004', customer: 'Nithin S', amount: 1600, status: 'success', method: 'netbanking', date: '2024-06-20T11:00:00Z' },
]

export default function RazorpayPayments() {
  const [payments] = useState(mockPayments)
  const [search, setSearch] = useState('')

  const filtered = payments.filter((p) => 
    p.id.toLowerCase().includes(search.toLowerCase()) || 
    p.customer.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'id', title: 'Payment ID' },
    { key: 'customer', title: 'Customer' },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'method', title: 'Method', render: (row) => <span className="uppercase">{row.method}</span> },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Payments' }, { label: 'Razorpay' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Razorpay Payments</h1>
        <SearchBar placeholder="Search payments..." onSearch={setSearch} />
      </div>
      <Table columns={columns} data={filtered} />
    </div>
  )
}
