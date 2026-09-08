import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Breadcrumb from '../components/layout/Breadcrumb'
import serviceCategoryService from '../services/serviceCategoryService'

export default function AddCategory() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', commission: '15', radius: '5', description: '', baseCharge: '0', perHourCharge: '0', perDayCharge: '0' })
  const [imagePreview, setImagePreview] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s) return
    if (skills.some((existing) => existing.toLowerCase() === s.toLowerCase())) {
      setSkillInput('')
      return
    }
    setSkills((prev) => [...prev, s])
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!imageBase64) {
      setError('Please upload a service image.')
      return
    }

    try {
      setSaving(true)
      await serviceCategoryService.create({
        name: form.name,
        image: imageBase64,
        commission: Number(form.commission),
        radius: Number(form.radius),
        description: form.description,
        baseCharge:    Number(form.baseCharge)    || 0,
        perHourCharge: Number(form.perHourCharge) || 0,
        perDayCharge:  Number(form.perDayCharge)  || 0,
        skills,
      })
      navigate('/services')
    } catch (err) {
      setError(err.message || 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Services', path: '/services' }, { label: 'Add Category' }]} />
      <div className="flex items-center gap-4">
        <Link to="/services"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Add Service Category</h1>
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
            <span className="text-sm text-accentAmber font-medium">
              {imagePreview ? 'Change image' : 'Upload image'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>

        <Input label="Category Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Commission (%)" type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} required />
        <Input label="Service Radius (km)" type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: e.target.value })} required />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
          <p className="md:col-span-3 text-xs font-medium text-textMuted -mb-1">
            Base pricing for this category — applied automatically to every business partner who registers under it.
          </p>
          <Input
            label="Base Charge (₹)"
            type="number"
            min="0"
            value={form.baseCharge}
            onChange={(e) => setForm({ ...form, baseCharge: e.target.value })}
            required
          />
          <Input
            label="Per Hour (₹)"
            type="number"
            min="0"
            value={form.perHourCharge}
            onChange={(e) => setForm({ ...form, perHourCharge: e.target.value })}
            required
          />
          <Input
            label="Per Day (₹)"
            type="number"
            min="0"
            value={form.perDayCharge}
            onChange={(e) => setForm({ ...form, perDayCharge: e.target.value })}
            required
          />
        </div>

        <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <div className="pt-2 border-t border-border">
          <label className="block text-sm font-medium text-textSecondary mb-1.5">Skills</label>
          <p className="text-xs text-textMuted mb-2">
            Shown to business partners at registration once they pick this category. They can select up to 10 skills total across all categories they join.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="e.g. Pipe fitting"
              className="flex-1 px-3 py-2 bg-surfaceElevated border border-border rounded-lg text-sm text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-accentYellow/50 focus:border-accentYellow transition-all"
            />
            <Button type="button" variant="outline" size="sm" onClick={addSkill}>Add</Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-surfaceElevated border border-border text-sm text-textPrimary"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="w-5 h-5 rounded-full bg-dangerSoft flex items-center justify-center hover:opacity-80"
                  >
                    <X size={12} className="text-danger" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Link to="/services"><Button variant="outline" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Category'}</Button>
        </div>
      </form>
    </div>
  )
}
