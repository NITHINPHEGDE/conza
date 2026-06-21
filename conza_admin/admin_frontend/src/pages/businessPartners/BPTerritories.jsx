import { useState } from 'react'
import { Edit, Trash2, Plus, MapPin } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const initialTerritories = [
  { id: '1', name: 'Bangalore North', bp: 'Vijay Enterprises', workers: 45, vendors: 12, active: true },
  { id: '2', name: 'Bangalore South', bp: 'Ramesh Associates', workers: 32, vendors: 8, active: true },
  { id: '3', name: 'Bangalore East', bp: 'Suresh Partners', workers: 28, vendors: 15, active: true },
  { id: '4', name: 'Bangalore West', bp: null, workers: 0, vendors: 0, active: false },
]

export default function BPTerritories() {
  const [territories, setTerritories] = useState(initialTerritories)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '' })

  const handleSave = () => {
    if (editing) {
      setTerritories(territories.map((t) => t.id === editing.id ? { ...t, name: form.name } : t))
    } else {
      setTerritories([...territories, { id: String(territories.length + 1), name: form.name, bp: null, workers: 0, vendors: 0, active: true }])
    }
    setModalOpen(false)
    setEditing(null)
    setForm({ name: '' })
  }

  const handleDelete = (id) => {
    setTerritories(territories.filter((t) => t.id !== id))
  }

  const columns = [
    { key: 'name', title: 'Territory', render: (row) => (
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-accentAmber" />
        <span className="font-medium text-textPrimary">{row.name}</span>
      </div>
    )},
    { key: 'bp', title: 'Assigned BP', render: (row) => row.bp || <span className="text-textMuted">Unassigned</span> },
    { key: 'workers', title: 'Workers' },
    { key: 'vendors', title: 'Vendors' },
    { key: 'active', title: 'Active', render: (row) => row.active ? 'Yes' : 'No' },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => { setEditing(row); setForm({ name: row.name }); setModalOpen(true); }}><Edit size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Business Partners', path: '/business-partners' }, { label: 'Territories' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Territories</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '' }); setModalOpen(true); }}>
          <Plus size={16} /> Add Territory
        </Button>
      </div>
      <Table columns={columns} data={territories} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Territory' : 'Add Territory'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <Input label="Territory Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Modal>
    </div>
  )
}
