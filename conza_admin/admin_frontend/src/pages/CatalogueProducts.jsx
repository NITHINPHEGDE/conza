import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Edit, Trash2, ImagePlus, X, Package } from 'lucide-react'
import Table from '../components/common/Table'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import SearchBar from '../components/common/SearchBar'
import Breadcrumb from '../components/layout/Breadcrumb'
import useCatalogueProductStore from '../store/catalogueProducts/useCatalogueProductStore'
import materialCategoryService from '../services/materialCategoryService'
import catalogueProductService from '../services/catalogueProductService'
import { useToastStore } from '../store/notifications/useToastStore'

const UNITS = ['bag', 'piece', 'ton', 'kg', 'litre', 'box', 'roll', 'sheet', 'set', 'meter']
const MAX_IMAGES = 5

const emptyForm = {
  name: '', brand: '', sku: '', description: '', category: '', unit: 'piece', images: [],
}

export default function CatalogueProducts() {
  const { products, fetchProducts, createProduct, updateProduct, deleteProduct, loading, error } = useCatalogueProductStore()
  const addToast = useToastStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchProducts()
    materialCategoryService.getAll({ limit: 100 })
      .then((res) => { if (res.success) setCategories((res.data || []).filter((c) => c.active !== false)) })
      .catch(() => {})
  }, [fetchProducts])

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  const openAddModal = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (row) => {
    setEditing(row)
    setForm({
      name: row.name || '',
      brand: row.brand || '',
      sku: row.sku || '',
      description: row.description || '',
      category: row.category || '',
      unit: row.unit || 'piece',
      images: row.images || [],
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (form.images.length + files.length > MAX_IMAGES) {
      setFormError(`You can add up to ${MAX_IMAGES} images.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploadingImage(true)
    setFormError(null)

    const readAsDataUrl = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    Promise.all(files.map((f) => readAsDataUrl(f)))
      .then((dataUris) => Promise.all(dataUris.map((uri) => catalogueProductService.uploadImage(uri))))
      .then((results) => {
        const urls = results.filter((r) => r.success).map((r) => r.url)
        setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, MAX_IMAGES) }))
        const failed = results.length - urls.length
        if (failed > 0) setFormError(`${failed} image(s) failed to upload.`)
      })
      .catch((err) => setFormError(err.message || 'Image upload failed'))
      .finally(() => {
        setUploadingImage(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
  }

  const removeImage = (index) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  const handleSave = async () => {
    setFormError(null)
    if (!form.name.trim()) return setFormError('Product name is required.')
    if (!form.category) return setFormError('Please select a category.')

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      sku: form.sku.trim(),
      description: form.description.trim(),
      category: form.category,
      unit: form.unit,
      images: form.images,
    }

    try {
      setSaving(true)
      const res = editing
        ? await updateProduct(editing.id, payload)
        : await createProduct(payload)
      if (res?.success === false) throw new Error(res.message || 'Failed to save product')
      addToast(editing ? 'Product updated.' : 'Product added to catalogue.', 'success')
      setModalOpen(false)
    } catch (err) {
      setFormError(err.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await deleteProduct(deleteTarget.id)
      if (res?.success === false) throw new Error(res.message || 'Failed to delete product')
      addToast(res.message || 'Product deleted.', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to delete product', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const columns = [
    { key: 'name', title: 'Product', render: (row) => (
      <div className="flex items-center gap-3">
        {row.images?.[0]
          ? <img src={row.images[0]} alt={row.name} className="w-9 h-9 rounded-lg object-cover border border-border" />
          : <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center"><Package size={14} className="text-amber-700" /></div>
        }
        <div>
          <p className="font-medium text-textPrimary">{row.name}</p>
          <p className="text-xs text-textMuted">{row.brand || '—'}</p>
        </div>
      </div>
    )},
    { key: 'sku', title: 'SKU', render: (row) => row.sku || '—' },
    { key: 'category', title: 'Category' },
    { key: 'unit', title: 'Unit' },
    { key: 'listings', title: 'Vendor Listings', render: (row) => row.listings || 0 },
    { key: 'isActive', title: 'Active', render: (row) => row.isActive ? 'Yes' : 'No' },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}><Edit size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Materials', path: '/materials' }, { label: 'Catalogue' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Product Catalogue</h1>
        <div className="flex items-center gap-3">
          <SearchBar placeholder="Search catalogue..." onSearch={setSearch} />
          <Button onClick={openAddModal}>
            <Plus size={16} /> Add Product
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Table
        columns={columns}
        data={loading ? [] : filtered}
        rowKey="id"
        emptyText={loading ? 'Loading...' : 'No products in the catalogue yet'}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || uploadingImage}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {formError && <div className="text-sm text-danger">{formError}</div>}

          <div>
            <h4 className="text-sm font-semibold text-textPrimary mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                placeholder="e.g. Portland Cement 50kg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Brand / Manufacturer"
                placeholder="e.g. UltraTech, TATA Steel"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <Input
                label="SKU / Product Code"
                placeholder="e.g. CEM-001"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
              <Select
                label="Unit of Measurement"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                options={UNITS.map((u) => ({ value: u, label: u }))}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-textSecondary mb-1.5">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentYellow/50"
                  rows={3}
                  placeholder="Describe the product, grade, specifications..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-textPrimary mb-3">Category</h4>
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={[
                { value: '', label: categories.length ? 'Select a category' : 'No categories found' },
                ...categories.map((c) => ({ value: c.name, label: c.name })),
              ]}
            />
            <p className="mt-1.5 text-xs text-textMuted">
              Fetched from Materials → Categories. Add one there first if it's missing.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-textPrimary">Product Images</h4>
              <span className="text-xs text-textMuted">{form.images.length}/{MAX_IMAGES}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {form.images.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {form.images.length < MAX_IMAGES && (
                <label className="w-20 h-20 rounded-lg border border-dashed border-border bg-surfaceElevated flex flex-col items-center justify-center cursor-pointer gap-1">
                  {uploadingImage
                    ? <span className="text-xs text-textMuted">Uploading...</span>
                    : <>
                        <ImagePlus size={18} className="text-textMuted" />
                        <span className="text-[10px] text-textMuted">Add</span>
                      </>
                  }
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={handleImagePick}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Product"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-textSecondary">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong> from the catalogue?
          {deleteTarget?.listings > 0 && (
            <> This product has {deleteTarget.listings} vendor listing(s) — they will be kept and unlinked, not deleted.</>
          )}
        </p>
      </Modal>
    </div>
  )
}
