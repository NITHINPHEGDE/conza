import { useState, useEffect } from 'react'
import { RefreshCw, Save, CheckSquare, Square } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import Button from '../../components/common/Button/Button'
import Table from '../../components/common/Table/Table'
import roleService from '../../services/roleService'
import useAuthStore from '../../store/auth/useAuthStore'

export default function Permissions() {
  const [roles, setRoles] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [checkedPerms, setCheckedPerms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const refreshPermissions = useAuthStore((s) => s.refreshPermissions)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissions(),
      ])
      if (rolesRes.success) {
        const fetchedRoles = rolesRes.roles || []
        setRoles(fetchedRoles)
        if (!selectedRoleId && fetchedRoles.length > 0) {
          const first = fetchedRoles[0]
          setSelectedRoleId(first._id)
          setCheckedPerms(first.permissions || [])
        }
      }
      if (permsRes.success) setAllPermissions(permsRes.permissions || [])
    } catch {
      setError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSelectRole = (role) => {
    if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return
    setSelectedRoleId(role._id)
    setCheckedPerms(role.permissions || [])
    setDirty(false)
    setSuccessMsg('')
  }

  const toggle = (key) => {
    setCheckedPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
    setDirty(true)
  }

  const toggleAll = () => {
    const allKeys = allPermissions.map((p) => p.key)
    const allChecked = allKeys.every((k) => checkedPerms.includes(k))
    setCheckedPerms(allChecked ? [] : allKeys)
    setDirty(true)
  }

  const handleSave = async () => {
    if (!selectedRoleId) return
    setSaving(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await roleService.updateRole(selectedRoleId, { permissions: checkedPerms })
      if (res.success) {
        setDirty(false)
        setSuccessMsg('Permissions saved. All admins in this role will receive updated access on next request.')
        // Refresh store in case the current admin's role was updated
        await refreshPermissions()
        await fetchData()
      } else {
        setError(res.message || 'Save failed.')
      }
    } catch {
      setError('Server error.')
    } finally {
      setSaving(false)
    }
  }

  const selectedRole = roles.find((r) => r._id === selectedRoleId)
  const allKeys = allPermissions.map((p) => p.key)
  const allChecked = allKeys.length > 0 && allKeys.every((k) => checkedPerms.includes(k))

  // Group by group field
  const groups = allPermissions.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = []
    acc[p.group].push(p)
    return acc
  }, {})

  const columns = [
    { key: 'label', title: 'Module' },
    {
      key: 'access', title: 'Access',
      render: (row) => (
        <button
          type="button"
          onClick={() => !selectedRole?.isSystem || window.confirm('This is a system role. Proceed?') ? toggle(row.key) : null}
          className="flex items-center gap-2 text-sm"
        >
          {checkedPerms.includes(row.key)
            ? <CheckSquare size={18} className="text-accentAmber" />
            : <Square size={18} className="text-textMuted" />}
          <span className={checkedPerms.includes(row.key) ? 'text-accentAmber font-medium' : 'text-textMuted'}>
            {checkedPerms.includes(row.key) ? 'Granted' : 'Denied'}
          </span>
        </button>
      )
    },
  ]

  return (
    <PageWrapper title="Permissions" subtitle="Configure database-driven role permissions — changes apply immediately">
      <div className="space-y-5">

        {/* Role tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {roles.map((role) => (
            <button
              key={role._id}
              onClick={() => handleSelectRole(role)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap border transition-colors ${
                selectedRoleId === role._id
                  ? 'bg-accentYellow text-accentAmber border-accentAmber font-medium'
                  : 'bg-surface text-textSecondary border-border hover:bg-surfaceElevated'
              }`}
            >
              {role.name}
              {role.isSystem && (
                <span className="ml-1 text-xs opacity-60">(system)</span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}
        {successMsg && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{successMsg}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-textMuted">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading...
          </div>
        ) : selectedRole ? (
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-textPrimary">{selectedRole.name}</h3>
                <p className="text-xs text-textMuted mt-0.5">
                  {checkedPerms.length} of {allPermissions.length} modules enabled
                  {dirty && <span className="ml-2 text-accentAmber">• Unsaved changes</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {allChecked ? 'Deselect All' : 'Select All'}
                </Button>
                <Button size="sm" onClick={handleSave} loading={saving} disabled={!dirty}>
                  <Save size={14} /> Save Permissions
                </Button>
              </div>
            </div>

            {/* Grouped permission grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(groups).map(([groupName, perms]) => (
                <div key={groupName} className="border border-border rounded-lg p-3">
                  <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">{groupName}</p>
                  <div className="space-y-1.5">
                    {perms.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 cursor-pointer text-sm text-textPrimary hover:text-accentAmber select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checkedPerms.includes(perm.key)}
                          onChange={() => toggle(perm.key)}
                          className="rounded border-border accent-accentAmber"
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-textMuted text-center py-12">No roles found.</p>
        )}
      </div>
    </PageWrapper>
  )
}
