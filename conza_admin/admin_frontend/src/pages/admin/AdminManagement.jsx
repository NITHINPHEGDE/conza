import { useState } from 'react'
import { Users, Plus, Trash2, Mail, Lock } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Modal from '../../components/common/Modal/Modal'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'

const initialAdmins = [
  { id: 1, name: 'Super Admin', email: 'superadmin@gmail.com', role: 'Super Admin', status: 'active', createdAt: '2024-01-15' },
  { id: 2, name: 'Operations Manager', email: 'ops.manager@gmail.com', role: 'Operations Manager', status: 'active', createdAt: '2024-02-20' },
  { id: 3, name: 'Finance Manager', email: 'finance@gmail.com', role: 'Finance Manager', status: 'active', createdAt: '2024-03-10' },
]

export default function AdminManagement() {
  const [admins, setAdmins] = useState(initialAdmins)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Operations Manager' })

  const handleAddAdmin = () => {
    if (!form.name || !form.email || !form.password) return
    const newAdmin = {
      id: admins.length + 1,
      name: form.name,
      email: form.email,
      role: form.role,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    }
    setAdmins([...admins, newAdmin])
    setForm({ name: '', email: '', password: '', role: 'Operations Manager' })
    setIsModalOpen(false)
  }

  const handleDelete = (id) => {
    setAdmins(admins.filter(a => a.id !== id))
  }

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Gmail ID', render: (row) => (
      <span className="flex items-center gap-2 text-textSecondary">
        <Mail size={14} />
        {row.email}
      </span>
    )},
    { key: 'role', title: 'Role' },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'createdAt', title: 'Created Date' },
    { key: 'actions', title: 'Actions', render: (row) => (
      <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}><Trash2 size={14} /></Button>
    )},
  ]

  return (
    <PageWrapper title="Admin Management" subtitle="Add and manage admin users with Gmail ID">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users size={24} className="text-accentAmber" />
            <h2 className="text-xl font-semibold text-textPrimary">Admin Users</h2>
          </div>
          <Button onClick={() => setIsModalOpen(true)}><Plus size={16} /> Add New Admin</Button>
        </div>

        <div className="flex gap-3 max-w-md">
          <Input
            placeholder="Search by name or Gmail ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Mail size={16} />}
          />
        </div>

        <Table columns={columns} data={filtered} />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Admin">
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter admin name"
            />
            <Input
              label="Gmail ID"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@gmail.com"
              icon={<Mail size={16} />}
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              icon={<Lock size={16} />}
            />
            <div>
              <label className="text-sm font-medium text-textSecondary block mb-1">Role</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-textPrimary"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option>Super Admin</option>
                <option>Operations Manager</option>
                <option>Finance Manager</option>
                <option>Support Manager</option>
                <option>Content Manager</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddAdmin}>Add Admin</Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageWrapper>
  )
}