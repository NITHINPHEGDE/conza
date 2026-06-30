import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import customerService from '../../services/customerService'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function CustomerOrders() {
  const { id } = useParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await customerService.getOrders(id)
        if (res.success) {
          setOrders((res.orders || res.data?.orders || []).map((o) => ({ ...o, id: o._id || o.id })))
        } else {
          setError(res.message || 'Failed to load orders')
        }
      } catch (err) {
        setError('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const columns = [
    { key: 'id', title: 'Order ID', render: (row) => <span className="text-xs text-textMuted">{row.id}</span> },
    { key: 'vendor', title: 'Vendor' },
    { key: 'total', title: 'Total', render: (row) => `₹${row.total}` },
    { key: 'paymentMethod', title: 'Payment', render: (row) => <span className="uppercase">{row.paymentMethod}</span> },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'createdAt', title: 'Date', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-' },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Customers', path: '/customers' }, { label: 'Orders' }]} />
      <div className="flex items-center gap-4">
        <Link to={`/customers/${id}`}><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Customer Orders</h1>
      </div>

      {loading && <p className="text-sm text-textMuted">Loading orders...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-textMuted">No orders found for this customer.</p>
      )}
      {!loading && !error && orders.length > 0 && (
        <Table columns={columns} data={orders} onRowClick={(row) => window.location.href = `/orders/${row.id}`} />
      )}
    </div>
  )
}