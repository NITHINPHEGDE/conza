import { useState } from 'react'
import { Edit, Trash2, Plus, Wallet } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockCashback = [
  { id: '1', name: 'Summer Cashback', percentage: 10, maxCashback: 200, minOrder: 1000, status: 'active', startDate: '2024-06-01', endDate: '2024-06-30' },
  { id: '2', name: 'New User Bonus', percentage: 20, maxCashback: 500, minOrder: 500, status: 'active', startDate: '2024-01-01', endDate: '2024-12-31' },
]

export default function Cashback() {
  const [campaigns, setCampaigns] = useState(mockCashback)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', percentage: '', maxCashback: '', minOrder: '', startDate: '', endDate: '' })

  const handleSave = () => {
    setCampaigns([...campaigns, { ...form, id: String(campaigns.length + 1), status: 'active' }])
    setModalOpen(false)
    setForm({ name: '', percentage: '', maxCashback: '', minOrder: '', startDate: '', endDate: '' })
  }

  const handleDelete = (id) => {
    setCampaigns(campaigns.filter((c) => c.id !== id))
  }

  const columns = [
    { key: 'name', title: 'Campaign', render: (row) => (
      <div className="flex items-center gap-2">
        <Wallet size={14} className="text-green-500" />
        <span className="font-medium text-textPrimary">{row.name}</span>
      </div>
    )},
    { key: 'percentage', title: 'Cashback %', render: (row) => `${row.percentage}%` },
    { key: 'maxCashback', title: 'Max Cashback', render: (row) => `₹${row.maxCashback}` },
    { key: 'minOrder', title: 'Min Order', render: (row) => `₹${row.minOrder}` },
    { key: 'status', title: 'Status', render: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{row.status}</span> },
    { key: 'startDate', title: 'Start', render: (row) => new Date(row.startDate).toLocaleDateString() },
    { key: 'endDate', title: 'End', render: (row) => new Date(row.endDate).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm"><Edit size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Promotions' }, { label: 'Cashback' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Cashback Campaigns</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add Campaign</Button>
      </div>
      <Table columns={columns} data={campaigns} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Cashback Campaign"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Campaign Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Cashback %" type="number" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} />
          <Input label="Max Cashback" type="number" value={form.maxCashback} onChange={(e) => setForm({ ...form, maxCashback: e.target.value })} />
          <Input label="Min Order" type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
