import { useState, useEffect } from 'react'
import { RefreshCw, ShieldCheck } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Modal from '../../components/common/Modal/Modal'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import roleService from '../../services/roleService'
import useAuthStore from '../../store/auth/useAuthStore'

export default function RoleManagement() {
  const [roles, setRoles] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editRole, setEditRole] = useState(null)
  const [saving, setSaving] = useState(false)
  const refreshPermissions = useAuthStore((s) => s.refreshPermissions)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissions(),
      ])
      if (rolesRes.success) setRoles(rolesRes.roles || [])
      if (permsRes.success) setAllPermissions(permsRes.permissions || [])
    } catch {
      setError('Failed to load roles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async (formData) => {
    setSaving(true)
    try {
      let res
      if (formData._id) {
        res = await roleService.updateRole(formData._id, {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          status: formData.status,
        })
      } else {
        res = await roleService.createRole({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          status: formData.status,
        })
      }
      if (res.success) {
        await fetchData()
        // Refresh current admin's permissions in case their role was updated
        await refreshPermissions()
        setIsModalOpen(false)
        setEditRole(null)
      } else {
        alert(res.message || 'Failed to save role.')
      }
    } catch {
      alert('Server error.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, isSystem) => {
    if (isSystem) return alert('Cannot delete system roles.')
    if (!window.confirm('Delete this role?')) return
    const res = await roleService.deleteRole(id)
    if (res.success) {
      await fetchData()
      await refreshPermissions()
    } else {
      alert(res.message || 'Failed to delete role.')
    }
  }

  const handleToggleStatus = async (id) => {
    const res = await roleService.toggleStatus(id)
    if (res.success) {
      await fetchData()
      await refreshPermissions()
    }
  }

  const columns = [
    { key: 'name',        title: 'Role Name' },
    { key: 'description', title: 'Description' },
    {
      key: 'users', title: 'Users',
      render: (row) => <span className="text-sm text-textSecondary">{row.users ?? 0}</span>
    },
    {
      key: 'permissions', title: 'Permissions',
      render: (row) => (
        <span className="text-xs text-textMuted">
          {row.permissions?.includes('all')
            ? 'All'
            : `${row.permissions?.length ?? 0} modules`}
        </span>
      )
    },
    {
      key: 'status', title: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions', title: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setEditRole(row); setIsModalOpen(true) }}>Edit</Button>
          <Button size="sm" variant="outline" onClick={() => handleToggleStatus(row._id)}>
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          {!row.isSystem && (
            <Button size="sm" variant="danger" onClick={() => handleDelete(row._id, row.isSystem)}>
              Delete
            </Button>
          )}
        </div>
      )
    },
  ]

  return (
    <PageWrapper title="Role Management" subtitle="Manage admin roles and permissions (database-driven)">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-accentAmber" />
            <h2 className="text-lg font-semibold text-textPrimary">Admin Roles</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button onClick={() => { setEditRole(null); setIsModalOpen(true) }}>Add Role</Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-textMuted">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading roles...
          </div>
        ) : (
          <Table columns={columns} data={roles} rowKey="_id" />
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditRole(null) }}
          title={editRole ? 'Edit Role' : 'Add Role'}
          size="lg"
        >
          <RoleForm
            role={editRole}
            allPermissions={allPermissions}
            onSave={handleSave}
            onCancel={() => { setIsModalOpen(false); setEditRole(null) }}
            saving={saving}
          />
        </Modal>
      </div>
    </PageWrapper>
  )
}

function RoleForm({ role, allPermissions, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    _id: role?._id || null,
    name: role?.name || '',
    description: role?.description || '',
    status: role?.status || 'active',
    permissions: role?.permissions || [],
  })

  const togglePermission = (key) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev, key],
    }))
  }

  const toggleAll = () => {
    const allKeys = allPermissions.map((p) => p.key)
    const allSelected = allKeys.every((k) => form.permissions.includes(k))
    setForm((prev) => ({
      ...prev,
      permissions: allSelected ? [] : allKeys,
    }))
  }

  // Group permissions by their group field
  const groups = allPermissions.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = []
    acc[p.group].push(p)
    return acc
  }, {})

  const allKeys = allPermissions.map((p) => p.key)
  const allSelected = allKeys.length > 0 && allKeys.every((k) => form.permissions.includes(k))

  return (
    <div className="space-y-5">
      <Input
        label="Role Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. Operations Manager"
      />
      <div className="space-y-1">
        <label className="text-sm font-medium text-textSecondary">Description</label>
        <textarea
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-textPrimary text-sm focus:outline-none focus:ring-2 focus:ring-accentAmber"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of this role"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-textSecondary">Status</label>
        <select
          className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-textPrimary text-sm focus:outline-none focus:ring-2 focus:ring-accentAmber"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-textSecondary">Module Permissions</label>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-accentAmber hover:underline"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-4 border border-border rounded-lg p-4 bg-surfaceElevated/30">
          {Object.entries(groups).map(([groupName, perms]) => (
            <div key={groupName}>
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">{groupName}</p>
              <div className="grid grid-cols-2 gap-2">
                {perms.map((perm) => (
                  <label
                    key={perm.key}
                    className="flex items-center gap-2 cursor-pointer text-sm text-textPrimary hover:text-accentAmber"
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                      className="rounded border-border accent-accentAmber"
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-textMuted">
          {form.permissions.length} of {allPermissions.length} modules selected
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={() => onSave(form)} loading={saving}>
          {form._id ? 'Update Role' : 'Create Role'}
        </Button>
      </div>
    </div>
  )
}
