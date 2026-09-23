import api from './api'

const materialService = {
  getAll: (params) => api.get(`/materials?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/materials/${id}`),
  update: (id, data) => api.put(`/materials/${id}`, data),
  remove: (id) => api.delete(`/materials/${id}`),
  toggleFeatured: (id) => api.put(`/materials/${id}/feature`),
  getFeatured: () => api.get('/materials/featured'),
  getLowStock: () => api.get('/inventory/low-stock'),
  getOutOfStock: () => api.get('/inventory/out-of-stock'),
}

export default materialService
