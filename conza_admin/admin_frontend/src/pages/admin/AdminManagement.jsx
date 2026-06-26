import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Mail, Lock, RefreshCw } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import Button from '../../components/common/Button/Button'
import Input from '../../components/common/Input/Input'
import Modal from '../../components/common/Modal/Modal'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import api from '../../services/api'

const ROLE_MAP = {
  super_admin: 'Super Admin',
  operations_manager: 'Operations Manager',
  finance_manager: 'Finance Manager',
  support_manager: 'Support Manager',
  content_manager: 'Content Manager',
}

const ROLE_VALUES = {
  'Super Admin': 'super_admin',
  'Operations Manager': 'operations_manager',
  'Finance Manager': 'finance_manager',
  'Support Manager': 'support_manager',
  'Content Manager': 'content_manager',
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Operations Manager' })
  const [formError, setFormError] = useState('')

  const fetchAdmins = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admins')
      if (res.success) {
        setAdmins(res.data)
      } else {
        setError(res.message || 'Failed to load admins.')
      }
    } catch {
      setError('Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleAddAdmin = async () => {
    setFormError('')
    if (!form.name || !form.email || !form.password) {
      setFormError('Name, email, and password are required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post('/admins', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: ROLE_VALUES[form.role] || 'operations_manager',
      })
      if (res.success) {
        setAdmins(prev => [res.admin, ...prev])
        setForm({ name: '', email: '', password: '', role: 'Operations Manager' })
        setIsModalOpen(false)
      } else {
        setFormError(res.message || 'Failed to create admin.')
      }
    } catch {
      setFormError('Unable to connect to server.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete admin "${name}"? This cannot be undone.`)) return
    try {
      const res = await api.delete(`/admins/${id}`)
      if (res.success) {
        setAdmins(prev => prev.filter(a => a._id !== id))
      } else {
        alert(res.message || 'Failed to delete admin.')
      }
    } catch {
      alert('Unable to connect to server.')
    }
  }

  const filtered = admins.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'name', title: 'Name' },
    {
      key: 'email', title: 'Gmail ID', render: (row) => (
        <span className="flex items-center gap-2 text-textSecondary">
          <Mail size={14} />
          {row.email}
        </span>
      )
    },
    {
      key: 'role', title: 'Role', render: (row) => (
        <span>{ROLE_MAP[row.role] || row.role}</span>
      )
    },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'createdAt', title: 'Created Date', render: (row) => (
        <span>{row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : '—'}</span>
      )
    },
    {
      key: 'actions', title: 'Actions', render: (row) => (
        <Button
          size="sm"
          variant="danger"
          onClick={() => handleDelete(row._id, row.name)}
          disabled={row.role === 'super_admin'}
          title={row.role === 'super_admin' ? 'Cannot delete super admin' : 'Delete admin'}
        >
          <Trash2 size={14} />
        </Button>
      )
    },
  ]

  return (
    <PageWrapper title="Admin Management" subtitle="Add and manage admin users with Gmail ID">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users size={24} className="text-accentAmber" />
            <h2 className="text-xl font-semibold text-textPrimary">Admin Users</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAdmins} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button onClick={() => { setFormError(''); setIsModalOpen(true) }}>
              <Plus size={16} /> Add New Admin
            </Button>
          </div>
        </div>

        <div className="flex gap-3 max-w-md">
          <Input
            placeholder="Search by name or Gmail ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Mail size={16} />}
          />
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-textMuted">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading admins...
          </div>
        ) : (
          <Table columns={columns} data={filtered} />
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12 text-textMuted">
            {search ? 'No admins match your search.' : 'No admins found.'}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Admin">
          <div className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {formError}
              </div>
            )}
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
              placeholder="Min. 8 characters"
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
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleAddAdmin} loading={submitting}>Add Admin</Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageWrapper>
  )
}