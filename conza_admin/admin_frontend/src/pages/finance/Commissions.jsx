import useFinanceStore from '../../store/finance/useFinanceStore'
import Table from '../../components/common/Table/Table'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function Commissions() {
  const { commissions } = useFinanceStore()

  const columns = [
    { key: 'id', title: 'Commission ID' },
    { key: 'source', title: 'Source' },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'type', title: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'date', title: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Finance', path: '/finance/revenue' }, { label: 'Commissions' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Commissions</h1>
      <Table columns={columns} data={commissions} />
    </div>
  )
}
