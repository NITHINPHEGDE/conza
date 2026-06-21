import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const initialFeatured = [
  { id: '1', title: 'Concrete Mixer', vendor: 'RentEquip Bangalore', category: 'Equipment', price: 800, featuredSince: '2024-06-01' },
  { id: '2', title: 'Scaffolding Set', vendor: 'BuildMart Pro', category: 'Safety', price: 1200, featuredSince: '2024-06-05' },
]

export default function FeaturedRentals() {
  const [featured, setFeatured] = useState(initialFeatured)

  const handleRemove = (id) => {
    setFeatured(featured.filter((f) => f.id !== id))
  }

  const columns = [
    { key: 'title', title: 'Rental Item' },
    { key: 'vendor', title: 'Vendor' },
    { key: 'category', title: 'Category' },
    { key: 'price', title: 'Price/Day', render: (row) => `₹${row.price}` },
    { key: 'featuredSince', title: 'Featured Since', render: (row) => new Date(row.featuredSince).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <Button variant="ghost" size="sm" onClick={() => handleRemove(row.id)}><Trash2 size={14} className="text-danger" /></Button>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Rentals', path: '/rentals' }, { label: 'Featured' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Featured Rentals</h1>
      <Table columns={columns} data={featured} />
    </div>
  )
}
