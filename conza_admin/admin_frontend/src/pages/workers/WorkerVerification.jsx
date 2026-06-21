import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Eye, FileText } from 'lucide-react'
import useWorkerStore from '../../store/workers/useWorkerStore'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function WorkerVerification() {
  const { workers, updateWorkerStatus, verifyWorker } = useWorkerStore()
  const pendingWorkers = workers.filter((w) => w.status === 'pending_verification')
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')

  const handleAction = (worker, action) => {
    setSelectedWorker(worker)
    setModalAction(action)
    setModalOpen(true)
  }

  const confirmAction = () => {
    if (modalAction === 'approve') {
      updateWorkerStatus(selectedWorker.id, 'active')
      verifyWorker(selectedWorker.id, 'documents', true)
    }
    if (modalAction === 'reject') updateWorkerStatus(selectedWorker.id, 'rejected')
    setModalOpen(false)
  }

  const columns = [
    { key: 'fullName', title: 'Worker', render: (row) => (
      <div>
        <p className="font-medium text-textPrimary">{row.fullName}</p>
        <p className="text-xs text-textMuted">{row.phone}</p>
      </div>
    )},
    { key: 'category', title: 'Category' },
    { key: 'experience', title: 'Experience', render: (row) => `${row.experience} years` },
    { key: 'minCharge', title: 'Min Charge', render: (row) => `₹${row.minCharge}` },
    { key: 'verification', title: 'Documents', render: (row) => (
      <div className="flex gap-1">
        {Object.entries(row.verification).map(([key, val]) => (
          <span key={key} className={`w-2 h-2 rounded-full ${val ? 'bg-success' : 'bg-gray-300'}`} title={key} />
        ))}
      </div>
    )},
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/workers/${row.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'approve')}><CheckCircle size={14} className="text-success" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'reject')}><XCircle size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Workers', path: '/workers' }, { label: 'Verification' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Worker Verification</h1>
      <Table columns={columns} data={pendingWorkers} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction === 'approve' ? 'Approve' : 'Reject'} Worker`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant={modalAction === 'approve' ? 'primary' : 'danger'} onClick={confirmAction}>Confirm</Button>
          </>
        }
      >
        <p className="text-textSecondary">
          Are you sure you want to {modalAction} <strong>{selectedWorker?.fullName}</strong>?
        </p>
      </Modal>
    </div>
  )
}
