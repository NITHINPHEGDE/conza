import { useState, useEffect, useCallback } from 'react'
import { Plus, Minus, Wallet, Search } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import api from '../../services/api'

export default function CustomerWallets() {
  const [wallets, setWallets]     = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [amount, setAmount]       = useState('')
  const [saving, setSaving]       = useState(false)
  const [description, setDescription] = useState('')

  const fetchWallets = useCallback(async (q = '') => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/wallets/customers?search=${encodeURIComponent(q)}&limit=100`)
      // api.js uses fetch and returns parsed JSON directly (not axios).
      // sendPaginated puts the items array in res.data
      setWallets(res?.data || [])
    } catch (err) {
      setError('Failed to load wallets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWallets() }, [fetchWallets])

  const handleSearch = (e) => {
    const q = e.target.value
    setSearch(q)
    fetchWallets(q)
  }

  const handleAction = (wallet, action) => {
    setSelected(wallet)
    setModalAction(action)
    setAmount('')
    setDescription('')
    setModalOpen(true)
  }

  const confirmAction = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setSaving(true)
    try {
      await api.put(`/wallets/${selected._id}/${modalAction}`, { amount: amt, description })
      await fetchWallets(search)
      setModalOpen(false)
    } catch (err) {
      alert(err?.message || 'Action failed')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'ownerName', title: 'Customer', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Wallet size={14} className="text-blue-700" />
        </div>
        <div>
          <p className="font-medium text-textPrimary">{row.ownerName}</p>
          <p className="text-xs text-textMuted">{row.ownerPhone || '—'}</p>
        </div>
      </div>
    )},
    { key: 'balance', title: 'Balance', render: (row) => (
      <span className="font-bold text-green-600">₹{row.balance ?? 0}</span>
    )},
    { key: 'totalCredit', title: 'Total Credited', render: (row) => `₹${row.totalCredit ?? 0}` },
    { key: 'totalDebit',  title: 'Total Debited',  render: (row) => `₹${row.totalDebit ?? 0}`  },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'credit')}>
          <Plus size={14} className="text-success" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction(row, 'debit')}>
          <Minus size={14} className="text-danger" />
        </Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Wallets' }, { label: 'Customers' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Customer Wallets</h1>
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-inputBg text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search customer…"
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}
      {loading ? (
        <p className="text-textMuted text-sm">Loading…</p>
      ) : (
        <Table columns={columns} data={wallets} />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalAction === 'credit' ? 'Credit' : 'Debit'} Wallet`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmAction} disabled={saving}>
              {saving ? 'Processing…' : 'Confirm'}
            </Button>
          </>
        }
      >
        <p className="text-textSecondary mb-4">
          Customer: <strong>{selected?.ownerName}</strong><br />
          Current Balance: <strong className="text-green-600">₹{selected?.balance ?? 0}</strong>
        </p>
        <Input
          label="Amount (₹)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
        <div className="mt-3">
          <Input
            label="Description (optional)"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Promotional credit"
          />
        </div>
      </Modal>
    </div>
  )
}
