import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Edit, Trash2, Plus, Wrench } from 'lucide-react'
import Table from '../../components/common/Table/Table'
import Button from '../../components/common/Button/Button'
import Modal from '../../components/common/Modal/Modal'
import Breadcrumb from '../../components/layout/Breadcrumb/Breadcrumb'

const mockCategories = [
  { id: '1', name: 'Plumber', baseCharge: 500, commission: 15, radius: 5, workers: 342, bookings: 1256, active: true },
  { id: '2', name: 'Electrician', baseCharge: 600, commission: 15, radius: 5, workers: 298, bookings: 980, active: true },
  { id: '3', name: 'Carpenter', baseCharge: 550, commission: 15, radius: 5, workers: 245, bookings: 820, active: true },
  { id: '4', name: 'Mason', baseCharge: 700, commission: 15, radius: 5, workers: 198, bookings: 650, active: true },
  { id: '5', name: 'Painter', baseCharge: 450, commission: 15, radius: 5, workers: 156, bookings: 480, active: true },
  { id: '6', name: 'Builder', baseCharge: 800, commission: 15, radius: 5, workers: 87, bookings: 320, active: true },
  { id: '7', name: 'AC Repair', baseCharge: 400, commission: 15, radius: 5, workers: 120, bookings: 450, active: true },
  { id: '8', name: 'Appliance Repair', baseCharge: 350, commission: 15, radius: 5, workers: 95, bookings: 380, active: true },
]

export default function Categories() {
  const [categories, setCategories] = useState(mockCategories)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const handleDelete = (id) => {
    setCategories(categories.filter((c) => c.id !== id))
  }

  const columns = [
    { key: 'name', title: 'Category', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accentYellowSoft flex items-center justify-center">
          <Wrench size={14} className="text-accentAmber" />
        </div>
        <span className="font-medium text-textPrimary">{row.name}</span>
      </div>
    )},
    { key: 'baseCharge', title: 'Base Charge', render: (row) => `₹${row.baseCharge}` },
    { key: 'commission', title: 'Commission', render: (row) => `${row.commission}%` },
    { key: 'radius', title: 'Radius', render: (row) => `${row.radius} km` },
    { key: 'workers', title: 'Workers' },
    { key: 'bookings', title: 'Bookings' },
    { key: 'active', title: 'Active', render: (row) => row.active ? 'Yes' : 'No' },
    { key: 'actions', title: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <Link to={`/services/edit/${row.id}`}><Button variant="ghost" size="sm"><Edit size={14} /></Button></Link>
        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}><Trash2 size={14} className="text-danger" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Services' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-textPrimary">Service Categories</h1>
        <Link to="/services/add">
          <Button><Plus size={16} /> Add Category</Button>
        </Link>
      </div>
      <Table columns={columns} data={categories} />
    </div>
  )
}
