import api from './api'

const auditLogService = {
  getLogs: (params = {}) => {
    const q = new URLSearchParams()
    if (params.search)   q.set('search',   params.search)
    if (params.module)   q.set('module',   params.module)
    if (params.severity) q.set('severity', params.severity)
    if (params.page)     q.set('page',     params.page)
    if (params.limit)    q.set('limit',    params.limit)
    return api.get(`/audit-logs?${q.toString()}`)
  },

  getLoginHistory: (params = {}) => {
    const q = new URLSearchParams()
    if (params.search) q.set('search', params.search)
    if (params.status) q.set('status', params.status)
    if (params.page)   q.set('page',   params.page)
    if (params.limit)  q.set('limit',  params.limit)
    return api.get(`/audit-logs/login-history?${q.toString()}`)
  },

  getAdminActions: (params = {}) => {
    const q = new URLSearchParams()
    if (params.search) q.set('search', params.search)
    if (params.type)   q.set('type',   params.type)
    if (params.page)   q.set('page',   params.page)
    if (params.limit)  q.set('limit',  params.limit)
    return api.get(`/audit-logs/admin-actions?${q.toString()}`)
  },
}

export default auditLogService