import { useState } from 'react'
import { Plus, Minus, HardHat } from 'lucide-react'
import { mockWorkers } from '../../mock/workers'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function WorkerWallets() {
  const [workers, setWorkers] = useState(mockWorkers.map((w) => ({ ...w, walletBalance: w.earnings.pending })))
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [amount, setAmount] = useState('')

  const handleAction = (worker, action) => {
    setSelected(worker)
    setModalAction(action)
    setAmount('')
    setModalOpen(true)
  }

  const confirmAction = () => {
    const amt = parseFloat(amount) || 0
    if (modalAction === 'credit') {
      setWorkers(workers.map((w) => w.id === selected.id ? { ...w, walletBalance: w.walletBalance + amt } : w))
    } else if (modalAction === 'debit') {
      setWorkers(workers.map((w) => w.id === selected.id ? { ...w, walletBalance: Math.max(0, w.walletBalance - amt) } : w))
    }
    setModalOpen(false)
  }

  const columns = [
    { key: 'fullName', title: 'Worker', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accentYellowSoft flex items-center justify-center">
          <HardHat size={14} className="text-accentAmber" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.fullName}</p>
          <p className="text-xs text-textMuted">{row.phone}</p>
        </div>
      </div>
    )},
    { key: 'walletBalance', title: 'Balance', render: (row) => `₹${row.walletBalance}` },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'credit')}><Plus size={14} className="text-success" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'debit')}><Minus size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Wallets' }, { label: 'Workers' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Worker Wallets</h1>
      <Table columns={columns} data={workers} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction === 'credit' ? 'Credit' : 'Debit'} Wallet`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmAction}>Confirm</Button>
          </>
        }
      >
        <p className="text-textSecondary mb-4">Worker: <strong>{selected?.fullName}</strong></p>
        <Input label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
      </Modal>
    </div>
  )
}
