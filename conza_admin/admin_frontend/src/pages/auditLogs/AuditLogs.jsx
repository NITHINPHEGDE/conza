import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Table from '../../components/common/Table/Table'
import Select from '../../components/common/Select/Select'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'

const auditData = [
  { id: 1, admin: 'Rahul Sharma', action: 'Approved Vendor', target: 'Vendor #4821', module: 'Vendors', timestamp: '2024-06-21 10:23:45', severity: 'medium' },
  { id: 2, admin: 'Priya Patel', action: 'Suspended Worker', target: 'Worker #9234', module: 'Workers', timestamp: '2024-06-21 09:15:22', severity: 'high' },
  { id: 3, admin: 'Amit Kumar', action: 'Modified Wallet', target: 'Customer #1204', module: 'Wallets', timestamp: '2024-06-21 08:45:10', severity: 'high' },
  { id: 4, admin: 'Sneha Gupta', action: 'Approved Payout', target: 'Payout #8921', module: 'Finance', timestamp: '2024-06-20 17:30:00', severity: 'medium' },
  { id: 5, admin: 'Rahul Sharma', action: 'Deleted Listing', target: 'Material #4521', module: 'Materials', timestamp: '2024-06-20 16:12:33', severity: 'medium' },
  { id: 6, admin: 'Priya Patel', action: 'Resolved Dispute', target: 'Booking #7821', module: 'Bookings', timestamp: '2024-06-20 14:05:18', severity: 'low' },
  { id: 7, admin: 'Amit Kumar', action: 'Role Changed', target: 'Admin #45', module: 'Roles', timestamp: '2024-06-20 11:20:45', severity: 'high' },
  { id: 8, admin: 'Sneha Gupta', action: 'Refund Processed', target: 'Order #5621', module: 'Orders', timestamp: '2024-06-19 18:45:30', severity: 'medium' },
  { id: 9, admin: 'Rahul Sharma', action: 'Banner Updated', target: 'Banner #12', module: 'Content', timestamp: '2024-06-19 15:10:22', severity: 'low' },
  { id: 10, admin: 'Priya Patel', action: 'Category Edited', target: 'Plumbing', module: 'Services', timestamp: '2024-06-19 12:00:00', severity: 'low' }
]

const modules = ['All', 'Vendors', 'Workers', 'Wallets', 'Finance', 'Materials', 'Bookings', 'Orders', 'Roles', 'Content', 'Services']

export default function AuditLogs() {
  const [search, setSearch] = useState('')
  const [module, setModule] = useState('All')
  const [severity, setSeverity] = useState('all')

  const filtered = auditData.filter(a => {
    const matchSearch = a.admin.toLowerCase().includes(search.toLowerCase()) || a.action.toLowerCase().includes(search.toLowerCase())
    const matchModule = module === 'All' || a.module === module
    const matchSeverity = severity === 'all' || a.severity === severity
    return matchSearch && matchModule && matchSeverity
  })

  const columns = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'admin', label: 'Admin' },
    { key: 'action', label: 'Action' },
    { key: 'target', label: 'Target' },
    { key: 'module', label: 'Module' },
    { key: 'severity', label: 'Severity', render: (row) => <StatusBadge status={row.severity} /> }
  ]

  return (
    <PageWrapper title="Audit Logs" subtitle="Track all admin actions">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by admin or action..." />
          <Select value={module} onChange={(e) => setModule(e.target.value)} options={modules.map(m => ({ value: m, label: m }))} />
          <Select value={severity} onChange={(e) => setSeverity(e.target.value)} options={[
            { value: 'all', label: 'All Severities' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' }
          ]} />
        </div>

        <Table columns={columns} data={filtered} />
      </div>
    </PageWrapper>
  )
}
