import { useState } from 'react'
import { Eye, Plus, Minus, Wallet } from 'lucide-react'
import { mockCustomers } from '../../mock/customers'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function CustomerWallets() {
  const [customers, setCustomers] = useState(mockCustomers)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [amount, setAmount] = useState('')

  const handleAction = (customer, action) => {
    setSelected(customer)
    setModalAction(action)
    setAmount('')
    setModalOpen(true)
  }

  const confirmAction = () => {
    const amt = parseFloat(amount) || 0
    if (modalAction === 'credit') {
      setCustomers(customers.map((c) => c.id === selected.id ? { ...c, walletBalance: c.walletBalance + amt } : c))
    } else if (modalAction === 'debit') {
      setCustomers(customers.map((c) => c.id === selected.id ? { ...c, walletBalance: Math.max(0, c.walletBalance - amt) } : c))
    }
    setModalOpen(false)
  }

  const columns = [
    { key: 'fullName', title: 'Customer', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Wallet size={14} className="text-blue-700" />
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
      <Breadcrumb items={[{ label: 'Wallets' }, { label: 'Customers' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Customer Wallets</h1>
      <Table columns={columns} data={customers} />

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
        <p className="text-textSecondary mb-4">Customer: <strong>{selected?.fullName}</strong></p>
        <Input
          label="Amount (₹)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
      </Modal>
    </div>
  )
}
