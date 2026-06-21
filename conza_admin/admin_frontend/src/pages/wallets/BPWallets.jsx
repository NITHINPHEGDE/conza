import { useState } from 'react'
import { Plus, Minus, Handshake } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockBPs = [
  { id: '1', name: 'Vijay Enterprises', phone: '+91 9876543230', walletBalance: 45000 },
  { id: '2', name: 'Ramesh Associates', phone: '+91 9876543231', walletBalance: 32000 },
  { id: '3', name: 'Suresh Partners', phone: '+91 9876543232', walletBalance: 28000 },
]

export default function BPWallets() {
  const [bps, setBps] = useState(mockBPs)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [amount, setAmount] = useState('')

  const handleAction = (bp, action) => {
    setSelected(bp)
    setModalAction(action)
    setAmount('')
    setModalOpen(true)
  }

  const confirmAction = () => {
    const amt = parseFloat(amount) || 0
    if (modalAction === 'credit') {
      setBps(bps.map((b) => b.id === selected.id ? { ...b, walletBalance: b.walletBalance + amt } : b))
    } else if (modalAction === 'debit') {
      setBps(bps.map((b) => b.id === selected.id ? { ...b, walletBalance: Math.max(0, b.walletBalance - amt) } : b))
    }
    setModalOpen(false)
  }

  const columns = [
    { key: 'name', title: 'Business Partner', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Handshake size={14} className="text-purple-700" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.name}</p>
          <p className="text-xs text-textMuted">{row.phone}</p>
        </div>
      </div>
    )},
    { key: 'walletBalance', title: 'Balance', render: (row) => `₹${row.walletBalance.toLocaleString()}` },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'credit')}><Plus size={14} className="text-success" /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'debit')}><Minus size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Wallets' }, { label: 'Business Partners' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">BP Wallets</h1>
      <Table columns={columns} data={bps} />

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
        <p className="text-textSecondary mb-4">Partner: <strong>{selected?.name}</strong></p>
        <Input label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
      </Modal>
    </div>
  )
}
