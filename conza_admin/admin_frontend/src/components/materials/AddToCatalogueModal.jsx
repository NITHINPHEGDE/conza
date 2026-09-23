import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Input from '../common/Input'
import Select from '../common/Select'
import materialCategoryService from '../../services/materialCategoryService'
import catalogueProductService from '../../services/catalogueProductService'
import { useToastStore } from '../../store/notifications/useToastStore'

const UNITS = ['bag', 'piece', 'ton', 'kg', 'litre', 'box', 'roll', 'sheet', 'set', 'meter']
const MAX_IMAGES = 5

// Prefilled, editable "Add to Catalogue" form for a vendor's custom product
// listing. Creates a new CatalogueProduct and links it back to that listing.
export default function AddToCatalogueModal({ material, onClose, onSuccess }) {
  const addToast = useToastStore((s) => s.addToast)
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: material?.title || '',
    brand: material?.brand || '',
    sku: material?.sku || '',
    description: material?.description || '',
    category: material?.category || '',
    unit: UNITS.includes(material?.unit) ? material.unit : 'piece',
    images: (material?.images || []).filter((u) => typeof u === 'string' && /^https:\/\//i.test(u)).slice(0, MAX_IMAGES),
  })
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    materialCategoryService.getAll({ limit: 100 })
      .then((res) => { if (res.success) setCategories((res.data || []).filter((c) => c.active !== false)) })
      .catch(() => {})
  }, [])

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
      linkMaterialId: material?.id,
    }

    try {
      setSaving(true)
      const res = await catalogueProductService.create(payload)
      if (res?.success === false) throw new Error(res.message || 'Failed to add product to catalogue')
      addToast('Product added to catalogue.', 'success')
      onSuccess?.(res.product)
      onClose()
    } catch (err) {
      setFormError(err.message || 'Failed to add product to catalogue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={!!material}
      onClose={onClose}
      title="Add to Conza Catalogue"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || uploadingImage}>
            {saving ? 'Saving...' : 'Add to Catalogue'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {formError && <div className="text-sm text-danger">{formError}</div>}
        <p className="text-xs text-textMuted">
          Prefilled from <strong>{material?.title}</strong> ({material?.vendor}). Review and edit before adding it to the catalogue.
        </p>

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
            Fetched from Materials → Categories. If the vendor's category isn't listed, pick the closest match.
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
  )
}
