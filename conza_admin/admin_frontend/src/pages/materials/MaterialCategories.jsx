import { useState } from 'react'
import { Edit, Trash2, Plus } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const initialCategories = [
  { id: '1', name: 'Cement', products: 45, active: true },
  { id: '2', name: 'Steel', products: 32, active: true },
  { id: '3', name: 'Blocks', products: 28, active: true },
  { id: '4', name: 'Sand', products: 15, active: true },
  { id: '5', name: 'Paint', products: 56, active: true },
  { id: '6', name: 'Tiles', products: 42, active: true },
]

export default function MaterialCategories() {
  const [categories, setCategories] = useState(initialCategories)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '' })

  const handleSave = () => {
    if (editing) {
      setCategories(categories.map((c) => c.id === editing.id ? { ...c, name: form.name } : c))
    } else {
      setCategories([...categories, { id: String(categories.length + 1), name: form.name, products: 0, active: true }])
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
    { key: 'products', title: 'Products' },
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
      <Breadcrumb items={[{ label: 'Materials', path: '/materials' }, { label: 'Categories' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Material Categories</h1>
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
