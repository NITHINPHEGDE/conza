import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import Button from '../../components/common/Button/Button'
import Table from '../../components/common/Table/Table'

const modules = [
  { id: 'dashboard', name: 'Dashboard', read: true, write: false, delete: false },
  { id: 'customers', name: 'Customers', read: true, write: true, delete: false },
  { id: 'workers', name: 'Workers', read: true, write: true, delete: true },
  { id: 'vendors', name: 'Vendors', read: true, write: true, delete: true },
  { id: 'bp', name: 'Business Partners', read: true, write: true, delete: false },
  { id: 'bookings', name: 'Bookings', read: true, write: true, delete: false },
  { id: 'orders', name: 'Orders', read: true, write: true, delete: false },
  { id: 'materials', name: 'Materials', read: true, write: true, delete: true },
  { id: 'rentals', name: 'Rentals', read: true, write: true, delete: true },
  { id: 'inventory', name: 'Inventory', read: true, write: true, delete: false },
  { id: 'finance', name: 'Finance', read: true, write: false, delete: false },
  { id: 'wallets', name: 'Wallets', read: true, write: true, delete: false },
  { id: 'payments', name: 'Payments', read: true, write: false, delete: false },
  { id: 'maps', name: 'Live Maps', read: true, write: false, delete: false },
  { id: 'notifications', name: 'Notifications', read: true, write: true, delete: false },
  { id: 'complaints', name: 'Complaints', read: true, write: true, delete: false },
  { id: 'reviews', name: 'Reviews', read: true, write: true, delete: true },
  { id: 'promotions', name: 'Promotions', read: true, write: true, delete: true },
  { id: 'content', name: 'Content', read: true, write: true, delete: true },
  { id: 'analytics', name: 'Analytics', read: true, write: false, delete: false },
  { id: 'roles', name: 'Roles', read: true, write: true, delete: true },
  { id: 'audit', name: 'Audit Logs', read: true, write: false, delete: false }
]

const roles = ['Super Admin', 'Operations Manager', 'Finance Manager', 'Support Manager', 'Content Manager']

const roleDefaults = {
  'Super Admin': { read: true, write: true, delete: true },
  'Operations Manager': { read: true, write: true, delete: false },
  'Finance Manager': { read: true, write: false, delete: false },
  'Support Manager': { read: true, write: true, delete: false },
  'Content Manager': { read: true, write: true, delete: true }
}

export default function Permissions() {
  const [selectedRole, setSelectedRole] = useState('Super Admin')
  const [permissions, setPermissions] = useState(() => {
    const initial = {}
    roles.forEach(role => {
      initial[role] = modules.map(m => ({
        ...m,
        read: roleDefaults[role].read,
        write: roleDefaults[role].write,
        delete: roleDefaults[role].delete
      }))
    })
    return initial
  })

  const togglePermission = (role, moduleId, type) => {
    setPermissions(prev => ({
      ...prev,
      [role]: prev[role].map(m => m.id === moduleId ? { ...m, [type]: !m[type] } : m)
    }))
  }

  const columns = [
    { key: 'name', label: 'Module' },
    { key: 'read', label: 'Read', render: (row) => (
      <input type="checkbox" checked={row.read} onChange={() => togglePermission(selectedRole, row.id, 'read')} className="w-5 h-5 rounded" />
    )},
    { key: 'write', label: 'Write', render: (row) => (
      <input type="checkbox" checked={row.write} onChange={() => togglePermission(selectedRole, row.id, 'write')} className="w-5 h-5 rounded" />
    )},
    { key: 'delete', label: 'Delete', render: (row) => (
      <input type="checkbox" checked={row.delete} onChange={() => togglePermission(selectedRole, row.id, 'delete')} className="w-5 h-5 rounded" />
    )}
  ]

  return (
    <PageWrapper title="Permissions" subtitle="Configure role-based access control">
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {roles.map(role => (
            <button key={role} onClick={() => setSelectedRole(role)} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${selectedRole === role ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {role}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">{selectedRole} Permissions</h3>
            <Button size="sm" onClick={() => {
              const defaults = roleDefaults[selectedRole]
              setPermissions(prev => ({
                ...prev,
                [selectedRole]: modules.map(m => ({ ...m, read: defaults.read, write: defaults.write, delete: defaults.delete }))
              }))
            }}>Reset Defaults</Button>
          </div>
          <Table columns={columns} data={permissions[selectedRole]} />
        </div>
      </div>
    </PageWrapper>
  )
}
