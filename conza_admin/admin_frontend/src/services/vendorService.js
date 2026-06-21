import api from './api'

const vendorService = {
  getAll: (params) => api.get(`/vendors?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/vendors/${id}`),
  updateStatus: (id, status) => api.put(`/vendors/${id}/status`, { status }),
  getOrders: (id) => api.get(`/vendors/${id}/orders`),
  getEarnings: (id) => api.get(`/vendors/${id}/earnings`),
}

export default vendorService
