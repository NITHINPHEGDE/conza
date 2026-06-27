import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Table from '../../components/common/Table/Table'
import Select from '../../components/common/Select/Select'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import { useDebounce } from '../../hooks/useDebounce'
import auditLogService from '../../services/auditLogService'

const MODULE_OPTIONS = [
  'All', 'Admins', 'Customers', 'Workers', 'Vendors', 'Bookings', 'Orders',
  'Finance', 'Wallets', 'Materials', 'Rentals', 'Roles', 'Content', 'Services',
  'Notifications', 'Complaints', 'Reviews', 'Promotions', 'Analytics',
]

const SEVERITY_OPTIONS = [
  { value: 'all',    label: 'All Severities' },
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
]

const LIMIT = 20

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [module, setModule] = useState('All')
  const [severity, setSeverity] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const debouncedSearch = useDebounce(search, 400)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await auditLogService.getLogs({
        search: debouncedSearch,
        module,
        severity,
        page,
        limit: LIMIT,
      })
      if (res.success) {
        setLogs(res.data || [])
        setTotal(res.pagination?.total || 0)
      } else {
        setError(res.message || 'Failed to load audit logs.')
      }
    } catch {
      setError('Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, module, severity, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, module, severity])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const totalPages = Math.ceil(total / LIMIT)

  const columns = [
    {
      key: 'createdAt', title: 'Timestamp',
      render: (row) => (
        <span className="text-xs text-textMuted whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
        </span>
      )
    },
    { key: 'admin',    title: 'Admin' },
    { key: 'action',   title: 'Action' },
    { key: 'target',   title: 'Target' },
    { key: 'module',   title: 'Module' },
    {
      key: 'severity', title: 'Severity',
      render: (row) => <StatusBadge status={row.severity} />
    },
  ]

  return (
    <PageWrapper title="Audit Logs" subtitle="Real-time admin activity log from database">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by admin or action..." />
          </div>
          <Select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            options={MODULE_OPTIONS.map((m) => ({ value: m, label: m }))}
          />
          <Select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            options={SEVERITY_OPTIONS}
          />
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 border border-border rounded-lg hover:bg-surfaceElevated transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-textMuted' : 'text-textMuted'} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-textMuted">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading audit logs...
          </div>
        ) : (
          <>
            <Table columns={columns} data={logs} rowKey="_id" />

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-textMuted pt-2">
                <span>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} entries</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-border rounded-lg disabled:opacity-40 hover:bg-surfaceElevated transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-accentYellowSoft text-accentAmber rounded-lg font-medium">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-border rounded-lg disabled:opacity-40 hover:bg-surfaceElevated transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
