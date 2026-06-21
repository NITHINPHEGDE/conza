import { useParams } from 'react-router-dom'
import { mockWorkerRatings } from '../../mock/workers'
import Table from '../../components/common/Table/Table'
import StarRating from '../../components/common/StarRating/StarRating'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function WorkerRatings() {
  const { id } = useParams()
  const ratings = mockWorkerRatings.filter((r) => r.workerId === id)

  const columns = [
    { key: 'customer', title: 'Customer' },
    { key: 'rating', title: 'Rating', render: (row) => <StarRating rating={row.rating} /> },
    { key: 'comment', title: 'Comment' },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Workers', path: '/workers' }, { label: 'Ratings' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Worker Ratings</h1>
      <Table columns={columns} data={ratings} />
    </div>
  )
}
