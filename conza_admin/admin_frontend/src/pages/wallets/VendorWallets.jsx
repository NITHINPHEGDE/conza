import { useState } from 'react'
import { Plus, Minus, Store } from 'lucide-react'
import { mockVendors } from '../../mock/vendors'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function VendorWallets() {
  const [vendors, setVendors] = useState(mockVendors)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [amount, setAmount] = useState('')

  const handleAction = (vendor, action) => {
    setSelected(vendor)
    setModalAction(action)
    setAmount('')
    setModalOpen(true)
  }

  const confirmAction = () => {
    const amt = parseFloat(amount) || 0
    if (modalAction === 'credit') {
      setVendors(vendors.map((v) => v.id === selected.id ? { ...v, walletBalance: v.walletBalance + amt } : v))
    } else if (modalAction === 'debit') {
      setVendors(vendors.map((v) => v.id === selected.id ? { ...v, walletBalance: Math.max(0, v.walletBalance - amt) } : v))
    }
    setModalOpen(false)
  }

  const columns = [
    { key: 'shopName', title: 'Vendor', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <Store size={14} className="text-green-700" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.shopName}</p>
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
      <Breadcrumb items={[{ label: 'Wallets' }, { label: 'Vendors' }]} />
      <h1 className="text-2xl font-bold text-textPrimary">Vendor Wallets</h1>
      <Table columns={columns} data={vendors} />

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
        <p className="text-textSecondary mb-4">Vendor: <strong>{selected?.shopName}</strong></p>
        <Input label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
      </Modal>
    </div>
  )
}
