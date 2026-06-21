import { useState } from 'react'
import { Star, Trash2, Flag } from 'lucide-react'
import { mockWorkerRatings } from '../../mock/workers'
import Table from '../../components/common/Table/Table'
import StarRating from '../../components/common/StarRating/StarRating'
import Button from '../../components/common/Button/Button'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function WorkerReviews() {
  const [reviews, setReviews] = useState(mockWorkerRatings)

  const handleRemove = (id) => {
    setReviews(reviews.filter((r) => r.id !== id))
  }

  const columns = [
    { key: 'worker', title: 'Worker', render: (row) => <span className="font-medium text-textPrimary">{row.worker || 'Suresh Kumar'}</span> },
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
      <Breadcrumb items={[{ label: 'Reviews' }, { label: 'Workers' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Worker Reviews</h1>
      <Table columns={columns} data={reviews} />
    </div>
  )
}
