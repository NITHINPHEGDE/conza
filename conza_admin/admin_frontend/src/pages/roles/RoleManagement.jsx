import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Modal from '../../components/common/Modal/Modal'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'

const initialRoles = [
  { id: 1, name: 'Super Admin', description: 'Full access to all features', users: 3, status: 'active', permissions: ['all'] },
  { id: 2, name: 'Operations Manager', description: 'Manage users, workers, vendors, bookings, orders', users: 8, status: 'active', permissions: ['users', 'workers', 'vendors', 'bp', 'bookings', 'orders'] },
  { id: 3, name: 'Finance Manager', description: 'Manage payments, wallets, revenue, payouts', users: 4, status: 'active', permissions: ['payments', 'wallets', 'revenue', 'payouts'] },
  { id: 4, name: 'Support Manager', description: 'Manage tickets, complaints, reviews', users: 6, status: 'active', permissions: ['tickets', 'complaints', 'reviews'] },
  { id: 5, name: 'Content Manager', description: 'Manage banners, FAQ, content, promotions', users: 2, status: 'inactive', permissions: ['banners', 'faq', 'content', 'promotions'] }
]

export default function RoleManagement() {
  const [roles, setRoles] = useState(initialRoles)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editRole, setEditRole] = useState(null)

  const handleSave = (role) => {
    if (role.id) {
      setRoles(roles.map(r => r.id === role.id ? role : r))
    } else {
      setRoles([...roles, { ...role, id: roles.length + 1, users: 0 }])
    }
    setIsModalOpen(false)
    setEditRole(null)
  }

  const handleDelete = (id) => {
    setRoles(roles.filter(r => r.id !== id))
  }

  const toggleStatus = (id) => {
    setRoles(roles.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r))
  }

  const columns = [
    { key: 'name', label: 'Role Name' },
    { key: 'description', label: 'Description' },
    { key: 'users', label: 'Assigned Users' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { setEditRole(row); setIsModalOpen(true) }}>Edit</Button>
        <Button size="sm" onClick={() => toggleStatus(row.id)}>{row.status === 'active' ? 'Deactivate' : 'Activate'}</Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
      </div>
    )}
  ]

  return (
    <PageWrapper title="Role Management" subtitle="Manage admin roles and assignments">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Admin Roles</h2>
          <Button onClick={() => { setEditRole(null); setIsModalOpen(true) }}>Add Role</Button>
        </div>

        <Table columns={columns} data={roles} />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editRole ? 'Edit Role' : 'Add Role'}>
          <RoleForm role={editRole} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      </div>
    </PageWrapper>
  )
}

function RoleForm({ role, onSave, onCancel }) {
  const [form, setForm] = useState(role || { name: '', description: '', status: 'active', permissions: [] })
  const availablePermissions = ['all', 'users', 'workers', 'vendors', 'bp', 'bookings', 'orders', 'payments', 'wallets', 'revenue', 'payouts', 'tickets', 'complaints', 'reviews', 'banners', 'faq', 'content', 'promotions', 'analytics', 'audit', 'roles']

  const togglePermission = (perm) => {
    if (form.permissions.includes(perm)) {
      setForm({...form, permissions: form.permissions.filter(p => p !== perm)})
    } else {
      setForm({...form, permissions: [...form.permissions, perm]})
    }
  }

  return (
    <div className="space-y-4">
      <Input label="Role Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Permissions</label>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {availablePermissions.map(perm => (
            <label key={perm} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePermission(perm)} className="rounded" />
              <span className="text-sm capitalize">{perm}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button onClick={onCancel} variant="secondary">Cancel</Button>
        <Button onClick={() => onSave(form)} variant="primary">Save</Button>
      </div>
    </div>
  )
}
