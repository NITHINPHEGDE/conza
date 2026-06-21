import { useState } from 'react'
import { Edit, Trash2, Plus, Tag } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Input from '../../components/common/Input/Input'
import Select from '../../components/common/Select/Select'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockCoupons = [
  { id: '1', code: 'CONZA20', discount: 20, type: 'percentage', maxDiscount: 500, minOrder: 1000, usageLimit: 100, used: 45, status: 'active', expiry: '2024-07-31' },
  { id: '2', code: 'WELCOME50', discount: 50, type: 'flat', maxDiscount: 50, minOrder: 200, usageLimit: 500, used: 230, status: 'active', expiry: '2024-12-31' },
  { id: '3', code: 'SUMMER15', discount: 15, type: 'percentage', maxDiscount: 300, minOrder: 500, usageLimit: 200, used: 198, status: 'expired', expiry: '2024-05-31' },
]

export default function Coupons() {
  const [coupons, setCoupons] = useState(mockCoupons)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ code: '', discount: '', type: 'percentage', maxDiscount: '', minOrder: '', usageLimit: '', expiry: '' })

  const handleSave = () => {
    setCoupons([...coupons, { ...form, id: String(coupons.length + 1), used: 0, status: 'active' }])
    setModalOpen(false)
    setForm({ code: '', discount: '', type: 'percentage', maxDiscount: '', minOrder: '', usageLimit: '', expiry: '' })
  }

  const handleDelete = (id) => {
    setCoupons(coupons.filter((c) => c.id !== id))
  }

  const columns = [
    { key: 'code', title: 'Code', render: (row) => (
      <div className="flex items-center gap-2">
        <Tag size={14} className="text-accentAmber" />
        <span className="font-mono font-medium text-textPrimary">{row.code}</span>
      </div>
    )},
    { key: 'discount', title: 'Discount', render: (row) => row.type === 'percentage' ? `${row.discount}%` : `₹${row.discount}` },
    { key: 'maxDiscount', title: 'Max Discount', render: (row) => `₹${row.maxDiscount}` },
    { key: 'minOrder', title: 'Min Order', render: (row) => `₹${row.minOrder}` },
    { key: 'used', title: 'Used', render: (row) => `${row.used}/${row.usageLimit}` },
    { key: 'status', title: 'Status', render: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{row.status}</span> },
    { key: 'expiry', title: 'Expiry', render: (row) => new Date(row.expiry).toLocaleDateString() },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm"><Edit size={14} /></Button>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Promotions' }, { label: 'Coupons' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Coupons</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add Coupon</Button>
      </div>
      <Table columns={columns} data={coupons} />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Coupon"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Discount" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[{ value: 'percentage', label: 'Percentage' }, { value: 'flat', label: 'Flat' }]} />
          <Input label="Max Discount" type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
          <Input label="Min Order" type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
          <Input label="Usage Limit" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
          <Input label="Expiry Date" type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
