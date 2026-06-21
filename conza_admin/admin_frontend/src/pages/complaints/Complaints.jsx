import { useState } from 'react'
import { Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockComplaints = [
  { id: 'C001', user: 'Rahul Sharma', type: 'customer', subject: 'Worker did not arrive', priority: 'high', status: 'open' },
  { id: 'C002', user: 'BuildMart Pro', type: 'vendor', subject: 'Payout delayed', priority: 'medium', status: 'in_progress' },
  { id: 'C003', user: 'Priya Patel', type: 'customer', subject: 'Wrong item delivered', priority: 'high', status: 'open' },
  { id: 'C004', user: 'Suresh Kumar', type: 'worker', subject: 'App crashing', priority: 'low', status: 'resolved' },
]

export default function Complaints() {
  const [complaints, setComplaints] = useState(mockComplaints)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  const handleAction = (complaint, action) => {
    setSelected(complaint)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'resolve') setComplaints(complaints.map((c) => c.id === selected.id ? { ...c, status: 'resolved' } : c))
    if (modalAction === 'escalate') setComplaints(complaints.map((c) => c.id === selected.id ? { ...c, status: 'escalated' } : c))
    setModalOpen(false)
  }

  const columns = [
    { key: 'id', title: 'Complaint ID' },
    { key: 'user', title: 'User' },
    { key: 'type', title: 'Type', render: (row) => <span className="capitalize">{row.type}</span> },
    { key: 'subject', title: 'Subject' },
    { key: 'priority', title: 'Priority', render: (row) => <StatusBadge status={row.priority} label={row.priority} /> },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm"><Eye size={14} /></Button>
        {row.status === 'open' && (
          <>
            <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'resolve')}><CheckCircle size={14} className="text-success" /></Button>
            <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'escalate')}><AlertTriangle size={14} className="text-orange-500" /></Button>
          </>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Complaints' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Complaints</h1>
      <Table columns={columns} data={complaints} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction === 'resolve' ? 'Resolve' : 'Escalate'} Complaint`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={modalAction === 'resolve' ? 'primary' : 'danger'} onClick={confirmAction}>Confirm</Button>
          </>
        }
      >
        <p className="text-textSecondary">Are you sure you want to {modalAction} complaint <strong>{selected?.id}</strong>?</p>
      </Modal>
    </div>
  )
}
