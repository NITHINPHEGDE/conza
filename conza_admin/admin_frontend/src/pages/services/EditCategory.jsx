import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'
import serviceCategoryService from '../../services/serviceCategoryService'

export default function EditCategory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', commission: '', radius: '', description: '', active: true })
  const [imagePreview, setImagePreview] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await serviceCategoryService.getById(id)
        const category = res.category || {}
        setForm({
          name: category.name || '',
          commission: category.commission ?? '',
          radius: category.radius ?? '',
          description: category.description || '',
          active: category.active ?? true,
        })
        setImagePreview(category.image || null)
      } catch (err) {
        setError(err.message || 'Failed to load category')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      setSaving(true)
      const payload = {
        name: form.name,
        commission: Number(form.commission),
        radius: Number(form.radius),
        description: form.description,
        active: form.active,
      }
      if (imageBase64) payload.image = imageBase64

      await serviceCategoryService.update(id, payload)
      navigate('/services')
    } catch (err) {
      setError(err.message || 'Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-textMuted text-sm">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Services', path: '/services' }, { label: 'Edit Category' }]} />
      <div className="flex items-center gap-4">
        <Link to="/services"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Edit Service Category</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-surface rounded-xl border border-border p-6 space-y-4">
        {error && <div className="text-sm text-danger">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1.5">Service Image</label>
          <label className="flex items-center gap-4 cursor-pointer">
            <div className="w-20 h-20 rounded-lg border border-dashed border-border bg-surfaceElevated flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus size={22} className="text-textMuted" />
              )}
            </div>
            <span className="text-sm text-accentAmber font-medium">Change image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>

        <Input label="Category Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Commission (%)" type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} required />
        <Input label="Service Radius (km)" type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: e.target.value })} required />
        <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          <label htmlFor="active" className="text-sm text-textSecondary">Active</label>
        </div>

        <div className="flex gap-3 pt-4">
          <Link to="/services"><Button variant="outline" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Update Category'}</Button>
        </div>
      </form>
    </div>
  )
}
