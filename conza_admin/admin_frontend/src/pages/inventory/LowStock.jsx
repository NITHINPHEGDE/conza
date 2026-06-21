import { mockLowStockAlerts } from '../../mock/dashboard'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function LowStock() {
  const columns = [
    { key: 'product', title: 'Product' },
    { key: 'vendor', title: 'Vendor' },
    { key: 'stock', title: 'Current Stock' },
    { key: 'threshold', title: 'Threshold' },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status="low_stock" label="Low Stock" /> },
    { key: 'actions', title: 'Actions', render: () => (
      <Button variant="outline" size="sm">Notify Vendor</Button>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Inventory', path: '/inventory' }, { label: 'Low Stock' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Low Stock Alerts</h1>
      <Table columns={columns} data={mockLowStockAlerts} />
    </div>
  )
}
