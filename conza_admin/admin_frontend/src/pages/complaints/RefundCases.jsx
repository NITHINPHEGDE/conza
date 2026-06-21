import { useState } from 'react'
import { Eye, CheckCircle, XCircle } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockRefunds = [
  { id: 'RC001', user: 'Rahul Sharma', type: 'booking', reference: 'BK001', amount: 750, reason: 'Service not rendered', status: 'pending' },
  { id: 'RC002', user: 'Priya Patel', type: 'order', reference: 'ORD002', amount: 3200, reason: 'Wrong item', status: 'approved' },
]

export default function RefundCases() {
  const [refunds, setRefunds] = useState(mockRefunds)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  const handleAction = (refund, action) => {
    setSelected(refund)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'approve') setRefunds(refunds.map((r) => r.id === selected.id ? { ...r, status: 'approved' } : r))
    if (modalAction === 'reject') setRefunds(refunds.map((r) => r.id === selected.id ? { ...r, status: 'rejected' } : r))
    setModalOpen(false)
  }

  const columns = [
    { key: 'id', title: 'Case ID' },
    { key: 'user', title: 'User' },
    { key: 'type', title: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'reference', title: 'Reference' },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'reason', title: 'Reason' },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm"><Eye size={14} /></Button>
        {row.status === 'pending' && (
          <>
            <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'approve')}><CheckCircle size={14} className="text-success" /></Button>
            <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'reject')}><XCircle size={14} className="text-danger" /></Button>
          </>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Complaints', path: '/complaints' }, { label: 'Refund Cases' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Refund Cases</h1>
      <Table columns={columns} data={refunds} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction === 'approve' ? 'Approve' : 'Reject'} Refund`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={modalAction === 'approve' ? 'primary' : 'danger'} onClick={confirmAction}>Confirm</Button>
          </>
        }
      >
        <p className="text-textSecondary">Refund <strong>₹{selected?.amount}</strong> for {selected?.type} <strong>{selected?.reference}</strong>?</p>
      </Modal>
    </div>
  )
}
