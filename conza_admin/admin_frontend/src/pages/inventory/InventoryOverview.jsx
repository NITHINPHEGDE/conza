import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, AlertTriangle, XCircle, TrendingUp, Tags, Truck, ChevronRight } from 'lucide-react'
import inventoryService from '../../services/inventoryService'
import materialService from '../../services/materialService'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function InventoryOverview() {
  const [overview, setOverview] = useState({ total: 0, lowStock: 0, outOfStock: 0, active: 0 })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([
      inventoryService.getOverview(),
      materialService.getAll({ page: 1, limit: 50 }),
    ])
      .then(([overviewRes, listRes]) => {
        if (!mounted) return
        if (overviewRes.success) setOverview(overviewRes.overview)
        else setError(overviewRes.message || 'Failed to load inventory overview')
        if (listRes.success) setItems(listRes.data || [])
      })
      .catch(() => { if (mounted) setError('Failed to load inventory data') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const turnoverRate = overview.total > 0
    ? Math.round(((overview.total - overview.outOfStock) / overview.total) * 100)
    : 0

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

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textMuted">Total Products</p>
              <p className="text-2xl font-bold text-textPrimary">{overview.total.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-textPrimary">{overview.lowStock.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-textPrimary">{overview.outOfStock.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-textPrimary">{turnoverRate}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-textPrimary mb-3">Category Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/inventory/material-categories"
            className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 hover:border-accentYellow transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-accentYellowSoft flex items-center justify-center">
              <Tags size={20} className="text-accentAmber" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-textPrimary">Material Categories</p>
              <p className="text-xs text-textMuted">Create, edit and remove material categories</p>
            </div>
            <ChevronRight size={18} className="text-textMuted" />
          </Link>
          <Link
            to="/inventory/rental-categories"
            className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4 hover:border-accentYellow transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-accentYellowSoft flex items-center justify-center">
              <Truck size={20} className="text-accentAmber" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-textPrimary">Rental Categories</p>
              <p className="text-xs text-textMuted">Create, edit and remove rental categories</p>
            </div>
            <ChevronRight size={18} className="text-textMuted" />
          </Link>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-textPrimary mb-4">Inventory List</h3>
        {loading && <p className="text-sm text-textMuted">Loading…</p>}
        {!loading && items.length === 0 && !error && (
          <p className="text-sm text-textMuted">No products found.</p>
        )}
        {!loading && items.length > 0 && <Table columns={columns} data={items} />}
      </div>
    </div>
  )
}
