import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

export default function AddCategory() {
  const [form, setForm] = useState({ name: '', baseCharge: '', commission: '15', radius: '5' })

  const handleSubmit = (e) => {
    e.preventDefault()
    window.location.href = '/services'
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Services', path: '/services' }, { label: 'Add Category' }]} />
      <div className="flex items-center gap-4">
        <Link to="/services"><Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-textPrimary">Add Service Category</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl bg-surface rounded-xl border border-border p-6 space-y-4">
        <Input label="Category Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Base Charge (₹)" type="number" value={form.baseCharge} onChange={(e) => setForm({ ...form, baseCharge: e.target.value })} required />
        <Input label="Commission (%)" type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} required />
        <Input label="Service Radius (km)" type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: e.target.value })} required />
        <div className="flex gap-3 pt-4">
          <Link to="/services"><Button variant="outline" type="button">Cancel</Button></Link>
          <Button type="submit">Save Category</Button>
        </div>
      </form>
    </div>
  )
}
