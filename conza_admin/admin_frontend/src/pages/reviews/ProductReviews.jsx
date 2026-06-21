import { useState } from 'react'
import { Trash2, Flag } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StarRating from '../../components/common/StarRating/StarRating'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockProductReviews = [
  { id: '1', product: 'Portland Cement 50kg', customer: 'Rahul Sharma', rating: 5, comment: 'Great quality, fast delivery', date: '2024-06-20T12:00:00Z' },
  { id: '2', product: 'TMT Steel Bars 12mm', customer: 'Priya Patel', rating: 4, comment: 'Good quality steel', date: '2024-06-19T16:00:00Z' },
  { id: '3', product: 'Concrete Mixer Rental', customer: 'Nithin S', rating: 5, comment: 'Equipment was in excellent condition', date: '2024-06-18T10:00:00Z' },
]

export default function ProductReviews() {
  const [reviews, setReviews] = useState(mockProductReviews)

  const handleRemove = (id) => {
    setReviews(reviews.filter((r) => r.id !== id))
  }

  const columns = [
    { key: 'product', title: 'Product' },
    { key: 'customer', title: 'Customer' },
    { key: 'rating', title: 'Rating', render: (row) => <StarRating rating={row.rating} /> },
    { key: 'comment', title: 'Comment' },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm"><Flag size={14} className="text-orange-500" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleRemove(row.id)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Reviews' }, { label: 'Products' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Product Reviews</h1>
      <Table columns={columns} data={reviews} />
    </div>
  )
}
