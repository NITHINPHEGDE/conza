import { useParams } from 'react-router-dom'
import { mockVendorReviews } from '../../mock/vendors'
import Table from '../../components/common/Table/Table'
import StarRating from '../../components/common/StarRating/StarRating'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function VendorReviews() {
  const { id } = useParams()
  const reviews = mockVendorReviews.filter((r) => r.vendorId === id)

  const columns = [
    { key: 'customer', title: 'Customer' },
    { key: 'rating', title: 'Rating', render: (row) => <StarRating rating={row.rating} /> },
    { key: 'comment', title: 'Comment' },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Vendors', path: '/vendors' }, { label: 'Reviews' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Vendor Reviews</h1>
      <Table columns={columns} data={reviews} />
    </div>
  )
}
