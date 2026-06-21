import { Package, AlertTriangle, XCircle, TrendingUp } from 'lucide-react'
import { mockLowStockAlerts } from '../../mock/dashboard'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockInventory = [
  { id: '1', product: 'Portland Cement 50kg', vendor: 'BuildMart Pro', category: 'Cement', stock: 45, sold: 120, status: 'active' },
  { id: '2', product: 'TMT Steel Bars 12mm', vendor: 'SteelWorld India', category: 'Steel', stock: 120, sold: 340, status: 'active' },
  { id: '3', product: 'AAC Blocks 600×200×150', vendor: 'QuickBuild Supply', category: 'Blocks', stock: 0, sold: 89, status: 'out_of_stock' },
  { id: '4', product: 'River Sand (Fine)', vendor: 'NatureMats Co.', category: 'Sand', stock: 8, sold: 45, status: 'low_stock' },
  { id: '5', product: 'Premium Paint 20L', vendor: 'ColorWorld', category: 'Paint', stock: 25, sold: 67, status: 'active' },
]

export default function InventoryOverview() {
  const columns = [
    { key: 'product', title: 'Product' },
    { key: 'vendor', title: 'Vendor' },
    { key: 'category', title: 'Category' },
    { key: 'stock', title: 'Stock' },
    { key: 'sold', title: 'Sold' },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Inventory' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Inventory Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Total Products</p>
              <p className="text-2xl font-bold text-textPrimary">4,567</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Low Stock</p>
              <p className="text-2xl font-bold text-textPrimary">24</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <AlertTriangle size={20} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Out of Stock</p>
              <p className="text-2xl font-bold text-textPrimary">8</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
              <XCircle size={20} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Turnover Rate</p>
              <p className="text-2xl font-bold text-textPrimary">68%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Inventory List</h3>
        <Table columns={columns} data={mockInventory} />
      </div>
    </div>
  )
}
