import api from './api'

const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getRecent: () => api.get('/dashboard/recent'),
  getCharts: () => api.get('/dashboard/charts'),
}

export default dashboardService
