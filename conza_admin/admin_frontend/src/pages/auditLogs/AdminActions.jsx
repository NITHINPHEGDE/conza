import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Table from '../../components/common/Table/Table'
import Select from '../../components/common/Select/Select'

const actionData = [
  { id: 1, admin: 'Rahul Sharma', action: 'Vendor Approval', target: 'Vendor #4821 - BuildMart', details: 'Approved vendor registration after document verification', timestamp: '2024-06-21 10:23:45', type: 'approval' },
  { id: 2, admin: 'Priya Patel', action: 'Worker Suspension', target: 'Worker #9234 - Ramesh K', details: 'Suspended for repeated customer complaints (3 strikes)', timestamp: '2024-06-21 09:15:22', type: 'suspension' },
  { id: 3, admin: 'Amit Kumar', action: 'Wallet Credit', target: 'Customer #1204 - Ankit S', details: 'Credited ₹500 as goodwill gesture for delayed service', timestamp: '2024-06-21 08:45:10', type: 'wallet' },
  { id: 4, admin: 'Sneha Gupta', action: 'Payout Approval', target: 'Payout #8921 - Worker #4456', details: 'Approved weekly payout of ₹12,400', timestamp: '2024-06-20 17:30:00', type: 'payout' },
  { id: 5, admin: 'Rahul Sharma', action: 'Listing Removal', target: 'Material #4521 - Unsafe Drill', details: 'Removed due to safety concerns reported by customers', timestamp: '2024-06-20 16:12:33', type: 'removal' },
  { id: 6, admin: 'Priya Patel', action: 'Dispute Resolution', target: 'Booking #7821', details: 'Resolved in favor of customer, full refund issued', timestamp: '2024-06-20 14:05:18', type: 'dispute' },
  { id: 7, admin: 'Amit Kumar', action: 'Role Assignment', target: 'Admin #45 - Vikram J', details: 'Changed role from Support Manager to Operations Manager', timestamp: '2024-06-20 11:20:45', type: 'role' },
  { id: 8, admin: 'Sneha Gupta', action: 'Refund Processing', target: 'Order #5621', details: 'Processed refund of ₹2,400 to original payment method', timestamp: '2024-06-19 18:45:30', type: 'refund' },
  { id: 9, admin: 'Rahul Sharma', action: 'Banner Publish', target: 'Banner #12 - Summer Sale', details: 'Published banner for home_top position', timestamp: '2024-06-19 15:10:22', type: 'content' },
  { id: 10, admin: 'Priya Patel', action: 'Category Update', target: 'Plumbing Services', details: 'Updated base charge from ₹200 to ₹250', timestamp: '2024-06-19 12:00:00', type: 'settings' }
]

const actionTypes = ['All', 'approval', 'suspension', 'wallet', 'payout', 'removal', 'dispute', 'role', 'refund', 'content', 'settings']

export default function AdminActions() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All')

  const filtered = actionData.filter(a => {
    const matchSearch = a.admin.toLowerCase().includes(search.toLowerCase()) || a.target.toLowerCase().includes(search.toLowerCase())
    const matchType = type === 'All' || a.type === type
    return matchSearch && matchType
  })

  const columns = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'admin', label: 'Admin' },
    { key: 'action', label: 'Action' },
    { key: 'target', label: 'Target' },
    { key: 'details', label: 'Details' },
    { key: 'type', label: 'Type', render: (row) => (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{row.type}</span>
    )}
  ]

  return (
    <PageWrapper title="Admin Actions" subtitle="Detailed log of all admin activities">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by admin or target..." />
          <Select value={type} onChange={(e) => setType(e.target.value)} options={actionTypes.map(t => ({ value: t, label: t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1) }))} />
        </div>

        <Table columns={columns} data={filtered} />
      </div>
    </PageWrapper>
  )
}
