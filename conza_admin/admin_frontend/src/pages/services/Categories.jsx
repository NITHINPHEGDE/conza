import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Edit, Trash2, Plus } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import serviceCategoryService from '../../services/serviceCategoryService'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await serviceCategoryService.getAll({ limit: 100 })
      setCategories(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? This cannot be undone.')) return
    try {
      await serviceCategoryService.remove(id)
      setCategories((prev) => prev.filter((c) => c._id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete category')
    }
  }

  const columns = [
    { key: 'name', title: 'Category', render: (row) => (
      <div className="flex items-center gap-3">
        <img
          src={row.image}
          alt={row.name}
          className="w-8 h-8 rounded-lg object-cover border border-border"
        />
        <span className="font-medium text-textPrimary">{row.name}</span>
      </div>
    )},
    { key: 'commission', title: 'Commission', render: (row) => `${row.commission}%` },
    { key: 'baseCharge',    title: 'Base',  render: (row) => `₹${row.baseCharge    ?? 0}` },
    { key: 'perHourCharge', title: 'Hour',  render: (row) => `₹${row.perHourCharge ?? 0}` },
    { key: 'perDayCharge',  title: 'Day',   render: (row) => `₹${row.perDayCharge  ?? 0}` },
    { key: 'radius', title: 'Radius', render: (row) => `${row.radius} km` },
    { key: 'workers', title: 'Workers' },
    { key: 'bookings', title: 'Bookings' },
    { key: 'active', title: 'Active', render: (row) => row.active ? 'Yes' : 'No' },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/services/edit/${row._id}`}><Button variant="ghost" size="sm"><Edit size={14} /></Button></Link>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row._id)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Services' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Service Categories</h1>
        <Link to="/services/add">
          <Button><Plus size={16} /> Add Category</Button>
        </Link>
      </div>
      {error && <div className="text-sm text-danger">{error}</div>}
      <Table columns={columns} data={loading ? [] : categories} rowKey="_id" emptyText={loading ? 'Loading...' : 'No categories found'} />
    </div>
  )
}
