import { useState } from 'react'
import { Edit, Trash2, Plus, Gift } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockReferrals = [
  { id: '1', name: 'Refer & Earn', referrerBonus: 100, refereeBonus: 50, minOrder: 500, status: 'active' },
  { id: '2', name: 'Worker Referral', referrerBonus: 200, refereeBonus: 100, minOrder: 0, status: 'active' },
]

export default function Referrals() {
  const [programs, setPrograms] = useState(mockReferrals)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', referrerBonus: '', refereeBonus: '', minOrder: '' })

  const handleSave = () => {
    setPrograms([...programs, { ...form, id: String(programs.length + 1), status: 'active' }])
    setModalOpen(false)
    setForm({ name: '', referrerBonus: '', refereeBonus: '', minOrder: '' })
  }

  const handleDelete = (id) => {
    setPrograms(programs.filter((p) => p.id !== id))
  }

  const columns = [
    { key: 'name', title: 'Program', render: (row) => (
      <div className="flex items-center gap-2">
        <Gift size={14} className="text-purple-500" />
        <span className="font-medium text-textPrimary">{row.name}</span>
      </div>
    )},
    { key: 'referrerBonus', title: 'Referrer Bonus', render: (row) => `₹${row.referrerBonus}` },
    { key: 'refereeBonus', title: 'Referee Bonus', render: (row) => `₹${row.refereeBonus}` },
    { key: 'minOrder', title: 'Min Order', render: (row) => `₹${row.minOrder}` },
    { key: 'status', title: 'Status', render: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{row.status}</span> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm"><Edit size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Promotions' }, { label: 'Referrals' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Referral Programs</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add Program</Button>
      </div>
      <Table columns={columns} data={programs} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Referral Program"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Program Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Referrer Bonus" type="number" value={form.referrerBonus} onChange={(e) => setForm({ ...form, referrerBonus: e.target.value })} />
          <Input label="Referee Bonus" type="number" value={form.refereeBonus} onChange={(e) => setForm({ ...form, refereeBonus: e.target.value })} />
          <Input label="Min Order" type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
