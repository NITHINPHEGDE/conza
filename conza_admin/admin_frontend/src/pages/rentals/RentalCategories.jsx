import { useState, useEffect, useCallback } from 'react'
import { Edit, Trash2, Plus, ImagePlus } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import rentalCategoryService from '../../services/rentalCategoryService'

export default function RentalCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', active: true })
  const [imagePreview, setImagePreview] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await rentalCategoryService.getAll({ limit: 100 })
      if (res?.success === false) throw new Error(res.message || 'Failed to load categories')
      setCategories(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const openAddModal = () => {
    setEditing(null)
    setForm({ name: '', active: true })
    setImagePreview(null)
    setImageBase64(null)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditing(row)
    setForm({ name: row.name, active: row.active ?? true })
    setImagePreview(row.image || null)
    setImageBase64(null)
    setFormError(null)
    setModalOpen(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result)
      setImageBase64(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setFormError(null)
    if (!form.name.trim()) {
      setFormError('Category title is required.')
      return
    }
    if (!editing && !imageBase64) {
      setFormError('Please upload a category image.')
      return
    }

    try {
      setSaving(true)
      let res
      if (editing) {
        const payload = { name: form.name.trim(), active: form.active }
        if (imageBase64) payload.image = imageBase64
        res = await rentalCategoryService.update(editing._id, payload)
      } else {
        res = await rentalCategoryService.create({ name: form.name.trim(), image: imageBase64, active: form.active })
      }
      if (res?.success === false) throw new Error(res.message || 'Failed to save category')
      setModalOpen(false)
      await loadCategories()
    } catch (err) {
      setFormError(err.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? This cannot be undone.')) return
    try {
      const res = await rentalCategoryService.remove(id)
      if (res?.success === false) throw new Error(res.message || 'Failed to delete category')
      setCategories((prev) => prev.filter((c) => c._id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete category')
    }
  }

  const columns = [
    { key: 'name', title: 'Category', render: (row) => (
      <div className="flex items-center gap-3">
        <img
          src={row.image}
          alt={row.name}
          className="w-8 h-8 rounded-lg object-cover border border-border"
        />
        <span className="font-medium text-textPrimary">{row.name}</span>
      </div>
    )},
    { key: 'items', title: 'Items' },
    { key: 'active', title: 'Active', render: (row) => row.active ? 'Yes' : 'No' },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}><Edit size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row._id)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Rentals', path: '/rentals' }, { label: 'Categories' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Rental Categories</h1>
        <Button onClick={openAddModal}>
          <Plus size={16} /> Add Category
        </Button>
      </div>
      {error && <div className="text-sm text-danger">{error}</div>}
      <Table columns={columns} data={loading ? [] : categories} rowKey="_id" emptyText={loading ? 'Loading...' : 'No categories found'} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <div className="text-sm text-danger">{formError}</div>}

          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1.5">Category Image</label>
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="w-20 h-20 rounded-lg border border-dashed border-border bg-surfaceElevated flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus size={22} className="text-textMuted" />
                )}
              </div>
              <span className="text-sm text-accentAmber font-medium">
                {imagePreview ? 'Change image' : 'Upload image'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <Input label="Category Title" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span className="text-sm text-textSecondary">Active (visible in the customer app)</span>
          </label>
        </div>
      </Modal>
    </div>
  )
}
