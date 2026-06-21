import useFinanceStore from '../../store/finance/useFinanceStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function Transactions() {
  const { transactions } = useFinanceStore()

  const columns = [
    { key: 'id', title: 'Transaction ID' },
    { key: 'type', title: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'user', title: 'User' },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'method', title: 'Method', render: (row) => <span className="uppercase">{row.method}</span> },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Finance', path: '/finance/revenue' }, { label: 'Transactions' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Transactions</h1>
      <Table columns={columns} data={transactions} />
    </div>
  )
}
