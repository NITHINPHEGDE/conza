import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import workerService from '../services/workerService'
import Table from '../components/common/Table'
import StarRating from '../components/common/StarRating'
import Button from '../components/common/Button'
import Breadcrumb from '../components/layout/Breadcrumb'

export default function WorkerRatings() {
  const { id } = useParams()
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    workerService.getRatings(id)
      .then((res) => setRatings(res.ratings || res.data?.ratings || []))
      .finally(() => setLoading(false))
  }, [id])

  const columns = [
    { key: 'customer', title: 'Customer' },
    { key: 'rating', title: 'Rating', render: (row) => <StarRating rating={row.rating} /> },
    { key: 'comment', title: 'Comment', render: (row) => row.comment || '—' },
    { key: 'date', title: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Workers', path: '/workers' }, { label: 'Reviews & Ratings' }]} />
      <div className="flex items-center gap-4">
        <Link to={`/workers/${id}`}><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Worker Reviews & Ratings</h1>
      </div>
      {loading
        ? <div className="text-center py-12 text-textMuted">Loading reviews...</div>
        : <Table columns={columns} data={ratings} rowKey="_id" emptyText="No reviews or ratings yet for this worker." />}
    </div>
  )
}
