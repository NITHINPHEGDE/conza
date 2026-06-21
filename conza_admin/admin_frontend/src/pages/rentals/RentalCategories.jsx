import { useState } from 'react'
import { Edit, Trash2, Plus } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const initialCategories = [
  { id: '1', name: 'Equipment', items: 23, active: true },
  { id: '2', name: 'Tools', items: 45, active: true },
  { id: '3', name: 'Safety', items: 18, active: true },
  { id: '4', name: 'Power', items: 12, active: true },
]

export default function RentalCategories() {
  const [categories, setCategories] = useState(initialCategories)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '' })

  const handleSave = () => {
    if (editing) {
      setCategories(categories.map((c) => c.id === editing.id ? { ...c, name: form.name } : c))
    } else {
      setCategories([...categories, { id: String(categories.length + 1), name: form.name, items: 0, active: true }])
    }
    setModalOpen(false)
    setEditing(null)
    setForm({ name: '' })
  }

  const handleDelete = (id) => {
    setCategories(categories.filter((c) => c.id !== id))
  }

  const columns = [
    { key: 'name', title: 'Category Name' },
    { key: 'items', title: 'Items' },
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
      <Breadcrumb items={[{ label: 'Rentals', path: '/rentals' }, { label: 'Categories' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Rental Categories</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: '' }); setModalOpen(true); }}>
          <Plus size={16} /> Add Category
        </Button>
      </div>
      <Table columns={columns} data={categories} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <Input label="Category Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Modal>
    </div>
  )
}
