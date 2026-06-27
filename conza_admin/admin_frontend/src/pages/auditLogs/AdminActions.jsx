import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper/PageWrapper'
import SearchBar from '../../components/common/SearchBar/SearchBar'
import Table from '../../components/common/Table/Table'
import Select from '../../components/common/Select/Select'
import { useDebounce } from '../../hooks/useDebounce'
import auditLogService from '../../services/auditLogService'

const ACTION_TYPES = [
  'All', 'approval', 'suspension', 'wallet', 'payout', 'removal',
  'dispute', 'role', 'refund', 'content', 'settings', 'creation', 'deletion', 'update', 'login', 'other',
]

const LIMIT = 20

export default function AdminActions() {
  const [actions, setActions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const debouncedSearch = useDebounce(search, 400)

  const fetchActions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await auditLogService.getAdminActions({
        search: debouncedSearch,
        type,
        page,
        limit: LIMIT,
      })
      if (res.success) {
        setActions(res.data || [])
        setTotal(res.pagination?.total || 0)
      } else {
        setError(res.message || 'Failed to load admin actions.')
      }
    } catch {
      setError('Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, type, page])

  useEffect(() => { setPage(1) }, [debouncedSearch, type])
  useEffect(() => { fetchActions() }, [fetchActions])

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
    { key: 'admin',   title: 'Admin' },
    { key: 'action',  title: 'Action' },
    { key: 'target',  title: 'Target' },
    {
      key: 'details', title: 'Details',
      render: (row) => (
        <span className="text-xs text-textMuted max-w-xs truncate block" title={row.details}>
          {row.details || '—'}
        </span>
      )
    },
    {
      key: 'type', title: 'Type',
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-surfaceElevated text-textSecondary capitalize">
          {row.type}
        </span>
      )
    },
  ]

  return (
    <PageWrapper title="Admin Actions" subtitle="Real-time detailed log of all admin activities from database">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by admin or target..." />
          </div>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={ACTION_TYPES.map((t) => ({
              value: t,
              label: t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1),
            }))}
          />
          <button
            onClick={fetchActions}
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
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading admin actions...
          </div>
        ) : (
          <>
            <Table columns={columns} data={actions} rowKey="_id" />
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
