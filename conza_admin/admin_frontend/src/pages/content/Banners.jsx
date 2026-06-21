import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Modal from '../../components/common/Modal/Modal'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'

const initialBanners = [
  { id: 1, title: 'Summer Sale - 20% Off', position: 'home_top', status: 'active', startDate: '2024-06-01', endDate: '2024-06-30', clicks: 3420 },
  { id: 2, title: 'New Vendor Onboarding', position: 'vendor_dashboard', status: 'active', startDate: '2024-05-15', endDate: '2024-07-15', clicks: 1200 },
  { id: 3, title: 'Refer & Earn', position: 'customer_app', status: 'inactive', startDate: '2024-04-01', endDate: '2024-04-30', clicks: 5600 },
  { id: 4, title: 'Worker Safety Week', position: 'worker_app', status: 'active', startDate: '2024-06-10', endDate: '2024-06-17', clicks: 890 },
  { id: 5, title: 'Festive Discount', position: 'home_top', status: 'scheduled', startDate: '2024-10-01', endDate: '2024-10-31', clicks: 0 }
]

const positions = ['home_top', 'customer_app', 'worker_app', 'vendor_dashboard', 'bp_portal']

export default function Banners() {
  const [banners, setBanners] = useState(initialBanners)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editBanner, setEditBanner] = useState(null)

  const handleSave = (banner) => {
    if (banner.id) {
      setBanners(banners.map(b => b.id === banner.id ? banner : b))
    } else {
      setBanners([...banners, { ...banner, id: banners.length + 1, clicks: 0 }])
    }
    setIsModalOpen(false)
    setEditBanner(null)
  }

  const handleDelete = (id) => {
    setBanners(banners.filter(b => b.id !== id))
  }

  const toggleStatus = (id) => {
    setBanners(banners.map(b => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b))
  }

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'position', label: 'Position' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => toggleStatus(row.id)}>{row.status === 'active' ? 'Pause' : 'Activate'}</Button>
        <Button size="sm" onClick={() => { setEditBanner(row); setIsModalOpen(true) }}>Edit</Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
      </div>
    )}
  ]

  return (
    <PageWrapper title="Banner Management" subtitle="Manage platform banners and promotions">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Active Banners</h2>
          <Button onClick={() => { setEditBanner(null); setIsModalOpen(true) }}>Add Banner</Button>
        </div>

        <Table columns={columns} data={banners} />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editBanner ? 'Edit Banner' : 'Add Banner'}>
          <BannerForm banner={editBanner} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      </div>
    </PageWrapper>
  )
}

function BannerForm({ banner, onSave, onCancel }) {
  const [form, setForm] = useState(banner || { title: '', position: 'home_top', status: 'active', startDate: '', endDate: '', imageUrl: '' })

  return (
    <div className="space-y-4">
      <Input label="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Position</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.position} onChange={(e) => setForm({...form, position: e.target.value})}>
          {positions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>
      <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} />
      <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} />
      <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." />
      <div className="flex justify-end gap-3">
        <Button onClick={onCancel} variant="secondary">Cancel</Button>
        <Button onClick={() => onSave(form)} variant="primary">Save</Button>
      </div>
    </div>
  )
}
