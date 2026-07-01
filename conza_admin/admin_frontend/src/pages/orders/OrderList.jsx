import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import useOrderStore from '../../store/orders/useOrderStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function OrderList() {
  const navigate = useNavigate()
  const { loading, error, filters, setFilters, fetchOrders, getFilteredOrders } = useOrderStore()

  useEffect(() => {
    fetchOrders()
  }, [])

  const filtered = getFilteredOrders()

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
              { value: 'accepted', label: 'Accepted' },
              { value: 'out_for_delivery', label: 'Out for Delivery' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'active', label: 'Active' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'returned', label: 'Returned' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-textMuted">Loading orders...</div>
      ) : error ? (
        <div className="text-center py-12 text-danger">{error}</div>
      ) : (
        <Table columns={columns} data={filtered} onRowClick={(row) => navigate(`/orders/${row.id}`)} />
      )}
    </div>
  )
}
