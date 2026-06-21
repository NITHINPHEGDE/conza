import { useState } from 'react'
import { Edit, Trash2, Plus, Calendar } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockOffers = [
  { id: '1', name: 'Diwali Dhamaka', discount: 25, type: 'percentage', startDate: '2024-10-20', endDate: '2024-11-15', status: 'upcoming' },
  { id: '2', name: 'Monsoon Special', discount: 15, type: 'percentage', startDate: '2024-06-01', endDate: '2024-08-31', status: 'active' },
]

export default function SeasonalOffers() {
  const [offers, setOffers] = useState(mockOffers)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', discount: '', type: 'percentage', startDate: '', endDate: '' })

  const handleSave = () => {
    setOffers([...offers, { ...form, id: String(offers.length + 1), status: 'upcoming' }])
    setModalOpen(false)
    setForm({ name: '', discount: '', type: 'percentage', startDate: '', endDate: '' })
  }

  const handleDelete = (id) => {
    setOffers(offers.filter((o) => o.id !== id))
  }

  const columns = [
    { key: 'name', title: 'Offer', render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-accentAmber" />
        <span className="font-medium text-textPrimary">{row.name}</span>
      </div>
    )},
    { key: 'discount', title: 'Discount', render: (row) => `${row.discount}%` },
    { key: 'startDate', title: 'Start', render: (row) => new Date(row.startDate).toLocaleDateString() },
    { key: 'endDate', title: 'End', render: (row) => new Date(row.endDate).toLocaleDateString() },
    { key: 'status', title: 'Status', render: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-700' : row.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{row.status}</span> },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm"><Edit size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Promotions' }, { label: 'Seasonal Offers' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Seasonal Offers</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add Offer</Button>
      </div>
      <Table columns={columns} data={offers} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Seasonal Offer"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Offer Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Discount %" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
