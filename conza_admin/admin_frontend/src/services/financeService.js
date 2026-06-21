import api from './api'

const financeService = {
  getRevenue: (period) => api.get(`/finance/revenue?period=${period}`),
  getTransactions: (params) => api.get(`/finance/transactions?${new URLSearchParams(params)}`),
  getPayouts: (params) => api.get(`/finance/payouts?${new URLSearchParams(params)}`),
  approvePayout: (id) => api.put(`/finance/payouts/${id}/approve`),
  getReports: (type) => api.get(`/finance/reports?type=${type}`),
}

export default financeService
