import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, ShoppingCart } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockOrders = [
  { id: 'ORD001', customer: 'Rahul Sharma', vendor: 'BuildMart Pro', type: 'material', total: 4560, status: 'delivered', date: '2024-06-20T12:00:00Z' },
  { id: 'ORD002', customer: 'Priya Patel', vendor: 'SteelWorld India', type: 'material', total: 3200, status: 'out_for_delivery', date: '2024-06-20T11:30:00Z' },
  { id: 'ORD003', customer: 'Ananya R', vendor: 'QuickBuild Supply', type: 'rental', total: 1800, status: 'packed', date: '2024-06-20T10:00:00Z' },
  { id: 'ORD004', customer: 'Nithin S', vendor: 'NatureMats Co.', type: 'material', total: 2400, status: 'confirmed', date: '2024-06-19T16:00:00Z' },
  { id: 'ORD005', customer: 'Meena T', vendor: 'RentEquip Bangalore', type: 'rental', total: 5600, status: 'active', date: '2024-06-18T10:00:00Z' },
]

export default function OrderList() {
  const [orders] = useState(mockOrders)
  const [filters, setFilters] = useState({ status: 'all', type: 'all', search: '' })

  const filtered = orders.filter((o) => {
    if (filters.status !== 'all' && o.status !== filters.status) return false
    if (filters.type !== 'all' && o.type !== filters.type) return false
    if (filters.search && !o.id.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const columns = [
    { key: 'id', title: 'Order ID' },
    { key: 'customer', title: 'Customer' },
    { key: 'vendor', title: 'Vendor' },
    { key: 'type', title: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'total', title: 'Total', render: (row) => `₹${row.total}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <Link to={`/orders/${row.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Orders' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Orders</h1>
        <div className="flex items-center gap-3">
          <SearchBar placeholder="Search orders..." onSearch={(q) => setFilters({ ...filters, search: q })} />
          <Select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'material', label: 'Material' },
              { value: 'rental', label: 'Rental' },
            ]}
          />
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'new', label: 'New' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'packed', label: 'Packed' },
              { value: 'out_for_delivery', label: 'Out for Delivery' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'active', label: 'Active' },
              { value: 'returned', label: 'Returned' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>
      <Table columns={columns} data={filtered} onRowClick={(row) => window.location.href = `/orders/${row.id}`} />
    </div>
  )
}
