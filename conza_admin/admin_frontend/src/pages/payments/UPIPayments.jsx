import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockUPI = [
  { id: 'UPI001', customer: 'Rahul Sharma', amount: 750, upiId: 'rahul@upi', status: 'success', date: '2024-06-20T14:00:00Z' },
  { id: 'UPI002', customer: 'Nithin S', amount: 1600, upiId: 'nithin@upi', status: 'success', date: '2024-06-20T11:00:00Z' },
]

export default function UPIPayments() {
  const [payments] = useState(mockUPI)
  const [search, setSearch] = useState('')

  const filtered = payments.filter((p) => 
    p.customer.toLowerCase().includes(search.toLowerCase()) || 
    p.upiId.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'id', title: 'UPI ID' },
    { key: 'customer', title: 'Customer' },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'upiId', title: 'UPI ID' },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Payments' }, { label: 'UPI' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">UPI Payments</h1>
        <SearchBar placeholder="Search..." onSearch={setSearch} />
      </div>
      <Table columns={columns} data={filtered} />
    </div>
  )
}
