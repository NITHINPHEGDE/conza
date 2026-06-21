import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'

const loginData = [
  { id: 1, user: 'Rahul Sharma', email: 'rahul@conza.in', role: 'Super Admin', ip: '103.45.67.89', device: 'Chrome / Windows', location: 'Bangalore, IN', timestamp: '2024-06-21 10:23:45', status: 'success' },
  { id: 2, user: 'Priya Patel', email: 'priya@conza.in', role: 'Operations Manager', ip: '103.45.68.12', device: 'Safari / macOS', location: 'Mumbai, IN', timestamp: '2024-06-21 09:15:22', status: 'success' },
  { id: 3, user: 'Amit Kumar', email: 'amit@conza.in', role: 'Finance Manager', ip: '103.45.69.45', device: 'Firefox / Linux', location: 'Delhi, IN', timestamp: '2024-06-21 08:45:10', status: 'success' },
  { id: 4, user: 'Unknown', email: '-', role: '-', ip: '185.220.101.22', device: 'Chrome / Windows', location: 'Unknown', timestamp: '2024-06-21 08:30:00', status: 'failed' },
  { id: 5, user: 'Sneha Gupta', email: 'sneha@conza.in', role: 'Support Manager', ip: '103.45.70.78', device: 'Chrome / Android', location: 'Hyderabad, IN', timestamp: '2024-06-20 17:30:00', status: 'success' },
  { id: 6, user: 'Rahul Sharma', email: 'rahul@conza.in', role: 'Super Admin', ip: '103.45.67.89', device: 'Chrome / Windows', location: 'Bangalore, IN', timestamp: '2024-06-20 09:00:00', status: 'success' },
  { id: 7, user: 'Unknown', email: '-', role: '-', ip: '192.168.1.1', device: 'Bot / Unknown', location: 'Unknown', timestamp: '2024-06-20 03:45:22', status: 'failed' },
  { id: 8, user: 'Priya Patel', email: 'priya@conza.in', role: 'Operations Manager', ip: '103.45.68.12', device: 'Safari / macOS', location: 'Mumbai, IN', timestamp: '2024-06-19 18:20:10', status: 'success' }
]

export default function LoginHistory() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = loginData.filter(l => {
    const matchSearch = l.user.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = status === 'all' || l.status === status
    return matchSearch && matchStatus
  })

  const columns = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'user', label: 'User' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'ip', label: 'IP Address' },
    { key: 'device', label: 'Device' },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
  ]

  return (
    <PageWrapper title="Login History" subtitle="Track admin login attempts">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by user or email..." />
          <select className="px-3 py-2 border border-gray-300 rounded-lg" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <Table columns={columns} data={filtered} />
      </div>
    </PageWrapper>
  )
}
