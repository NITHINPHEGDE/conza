import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const initialFeatured = [
  { id: '1', title: 'Portland Cement 50kg', vendor: 'BuildMart Pro', category: 'Cement', price: 380, featuredSince: '2024-06-01' },
  { id: '2', title: 'TMT Steel Bars 12mm', vendor: 'SteelWorld India', category: 'Steel', price: 62, featuredSince: '2024-06-05' },
  { id: '3', title: 'Premium Paint 20L', vendor: 'ColorWorld', category: 'Paint', price: 2800, featuredSince: '2024-06-10' },
]

export default function FeaturedProducts() {
  const [featured, setFeatured] = useState(initialFeatured)

  const handleRemove = (id) => {
    setFeatured(featured.filter((f) => f.id !== id))
  }

  const columns = [
    { key: 'title', title: 'Product' },
    { key: 'vendor', title: 'Vendor' },
    { key: 'category', title: 'Category' },
    { key: 'price', title: 'Price', render: (row) => `₹${row.price}` },
    { key: 'featuredSince', title: 'Featured Since', render: (row) => new Date(row.featuredSince).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <Button variant="ghost" size="sm" onClick={() => handleRemove(row.id)}><Trash2 size={14} className="text-danger" /></Button>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Materials', path: '/materials' }, { label: 'Featured' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Featured Products</h1>
      <Table columns={columns} data={featured} />
    </div>
  )
}
