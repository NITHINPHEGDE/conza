import api from './api'

const serviceCategoryService = {
  getAll: (params = {}) => api.get(`/services?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  remove: (id) => api.delete(`/services/${id}`),
}

export default serviceCategoryService
