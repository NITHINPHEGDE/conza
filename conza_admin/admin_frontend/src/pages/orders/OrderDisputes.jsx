import { useState } from 'react'
import { Eye, CheckCircle, XCircle } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockDisputes = [
  { id: 'OD001', orderId: 'ORD002', customer: 'Priya Patel', vendor: 'SteelWorld India', issue: 'Wrong grade delivered', amount: 3200, status: 'open' },
  { id: 'OD002', orderId: 'ORD003', customer: 'Ananya R', vendor: 'QuickBuild Supply', issue: 'Damaged blocks', amount: 1800, status: 'in_progress' },
]

export default function OrderDisputes() {
  const [disputes, setDisputes] = useState(mockDisputes)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  const handleAction = (dispute, action) => {
    setSelected(dispute)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'resolve') setDisputes(disputes.map((d) => d.id === selected.id ? { ...d, status: 'resolved' } : d))
    if (modalAction === 'reject') setDisputes(disputes.map((d) => d.id === selected.id ? { ...d, status: 'rejected' } : d))
    setModalOpen(false)
  }

  const columns = [
    { key: 'id', title: 'Dispute ID' },
    { key: 'orderId', title: 'Order' },
    { key: 'customer', title: 'Customer' },
    { key: 'vendor', title: 'Vendor' },
    { key: 'issue', title: 'Issue' },
    { key: 'amount', title: 'Amount', render: (row) => `₹${row.amount}` },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm"><Eye size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'resolve')}><CheckCircle size={14} className="text-success" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'reject')}><XCircle size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Orders', path: '/orders' }, { label: 'Disputes' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Order Disputes</h1>
      <Table columns={columns} data={disputes} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction === 'resolve' ? 'Resolve' : 'Reject'} Dispute`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={modalAction === 'resolve' ? 'primary' : 'danger'} onClick={confirmAction}>Confirm</Button>
          </>
        }
      >
        <p className="text-textSecondary">Are you sure you want to {modalAction} dispute <strong>{selected?.id}</strong>?</p>
      </Modal>
    </div>
  )
}
