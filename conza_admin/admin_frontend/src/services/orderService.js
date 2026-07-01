import api from './api'

const orderService = {
  getAll: (params) => api.get(`/orders?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  getTracking: () => api.get('/orders/tracking'),
  getDisputes: () => api.get('/orders/disputes'),
}

export default orderService
