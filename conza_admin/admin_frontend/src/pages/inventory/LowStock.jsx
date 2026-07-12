import { useEffect, useState } from 'react'
import materialService from '../../services/materialService'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function LowStock() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    materialService.getLowStock()
      .then((res) => {
        if (!mounted) return
        if (res.success) setItems(res.materials || [])
        else setError(res.message || 'Failed to load low stock alerts')
      })
      .catch(() => { if (mounted) setError('Failed to load low stock alerts') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const columns = [
    { key: 'product', title: 'Product' },
    { key: 'vendor', title: 'Vendor' },
    { key: 'stock', title: 'Current Stock' },
    { key: 'threshold', title: 'Threshold' },
    { key: 'status', title: 'Status', render: () => <StatusBadge status="low_stock" label="Low Stock" /> },
    { key: 'actions', title: 'Actions', render: () => (
      <Button variant="outline" size="sm">Notify Vendor</Button>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Inventory', path: '/inventory' }, { label: 'Low Stock' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Low Stock Alerts</h1>
      {loading && <p className="text-sm text-textMuted">Loading…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-textMuted">No materials are currently low on stock.</p>
      )}
      {!loading && !error && items.length > 0 && (
        <Table columns={columns} data={items} />
      )}
    </div>
  )
}
