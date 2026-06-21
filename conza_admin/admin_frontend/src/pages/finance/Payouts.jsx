import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import useFinanceStore from '../../store/finance/useFinanceStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function Payouts() {
  const { payouts } = useFinanceStore()
  const [payoutList, setPayoutList] = useState(payouts)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleApprove = (payout) => {
    setSelected(payout)
    setModalOpen(true)
  }

  const confirmApprove = () => {
    setPayoutList(payoutList.map((p) => p.id === selected.id ? { ...p, status: 'completed' } : p))
    setModalOpen(false)
  }

  const columns = [
    { key: 'id', title: 'Payout ID' },
    { key: 'recipient', title: 'Recipient' },
    { key: 'type', title: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount.toLocaleString()}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'requestedAt', title: 'Requested', render: (row) => new Date(row.requestedAt).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        {row.status === 'pending' && (
          <Button variant="ghost" size="sm" onClick={() => handleApprove(row)}><CheckCircle size={14} className="text-success" /></Button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Finance', path: '/finance/revenue' }, { label: 'Payouts' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Payouts</h1>
      <Table columns={columns} data={payoutList} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Approve Payout"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmApprove}>Approve</Button>
          </>
        }
      >
        <p className="text-textSecondary">Approve payout of <strong>₹{selected?.amount.toLocaleString()}</strong> to <strong>{selected?.recipient}</strong>?</p>
      </Modal>
    </div>
  )
}
