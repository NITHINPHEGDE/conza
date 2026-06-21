import { useState } from 'react'
import { Trash2, Flag } from 'lucide-react'
import { mockVendorReviews } from '../../mock/vendors'
import Table from '../../components/common/Table/Table'
import StarRating from '../../components/common/StarRating/StarRating'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function VendorReviews() {
  const [reviews, setReviews] = useState(mockVendorReviews)

  const handleRemove = (id) => {
    setReviews(reviews.filter((r) => r.id !== id))
  }

  const columns = [
    { key: 'vendor', title: 'Vendor', render: (row) => <span className="font-medium text-textPrimary">{row.vendor || 'BuildMart Pro'}</span> },
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
      <Breadcrumb items={[{ label: 'Reviews' }, { label: 'Vendors' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Vendor Reviews</h1>
      <Table columns={columns} data={reviews} />
    </div>
  )
}
