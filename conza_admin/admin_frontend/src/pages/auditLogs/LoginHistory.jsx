import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Table from '../../components/common/Table/Table'
import StatusBadge from '../../components/common/StatusBadge/StatusBadge'
import { useDebounce } from '../../hooks/useDebounce'
import auditLogService from '../../services/auditLogService'

const LIMIT = 20

export default function LoginHistory() {
  const [history, setHistory] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const debouncedSearch = useDebounce(search, 400)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await auditLogService.getLoginHistory({
        search: debouncedSearch,
        status,
        page,
        limit: LIMIT,
      })
      if (res.success) {
        setHistory(res.data || [])
        setTotal(res.pagination?.total || 0)
      } else {
        setError(res.message || 'Failed to load login history.')
      }
    } catch {
      setError('Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, page])

  useEffect(() => { setPage(1) }, [debouncedSearch, status])
  useEffect(() => { fetchHistory() }, [fetchHistory])

  const totalPages = Math.ceil(total / LIMIT)

  const columns = [
    {
      key: 'timestamp', title: 'Timestamp',
      render: (row) => (
        <span className="text-xs text-textMuted whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
        </span>
      )
    },
    { key: 'user',     title: 'User' },
    { key: 'email',    title: 'Email' },
    { key: 'role',     title: 'Role' },
    { key: 'ip',       title: 'IP Address' },
    { key: 'device',   title: 'Device' },
    { key: 'location', title: 'Location' },
    {
      key: 'status', title: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
  ]

  return (
    <PageWrapper title="Login History" subtitle="Real-time admin login attempts from database">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by user or email..." />
          </div>
          <select
            className="px-3 py-2 border border-border rounded-lg bg-surface text-textPrimary text-sm focus:outline-none focus:ring-2 focus:ring-accentAmber"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <button
            onClick={fetchHistory}
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
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading login history...
          </div>
        ) : (
          <>
            <Table columns={columns} data={history} rowKey="_id" />
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-textMuted pt-2">
                <span>Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} entries</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-border rounded-lg disabled:opacity-40 hover:bg-surfaceElevated"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-accentYellowSoft text-accentAmber rounded-lg font-medium">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-border rounded-lg disabled:opacity-40 hover:bg-surfaceElevated"
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
