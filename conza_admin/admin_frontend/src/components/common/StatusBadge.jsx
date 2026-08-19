const statusStyles = {
  active: 'bg-green-100 text-green-700 border-green-200',
  online: 'bg-green-100 text-green-700 border-green-200',
  offline: 'bg-gray-100 text-gray-600 border-gray-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  verified: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  suspended: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  out_for_delivery: 'bg-orange-100 text-orange-700 border-orange-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-purple-100 text-purple-700 border-purple-200',
  new: 'bg-gray-100 text-gray-600 border-gray-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  arrived: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  awaiting_customer_confirmation: 'bg-orange-100 text-orange-700 border-orange-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
  returned: 'bg-green-100 text-green-700 border-green-200',
  packed: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  both: 'bg-purple-100 text-purple-700 border-purple-200',
  material: 'bg-amber-100 text-amber-700 border-amber-200',
  rental: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  out_of_stock: 'bg-orange-100 text-orange-700 border-orange-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  labour: 'bg-violet-100 text-violet-700 border-violet-200',
  default: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function StatusBadge({ status, label }) {
  const style = statusStyles[status?.toLowerCase()] || statusStyles.default
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {label || status}
    </span>
  )
}
