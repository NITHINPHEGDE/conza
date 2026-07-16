import api from './api'

const rentalCategoryService = {
  getAll: (params = {}) => api.get(`/rental-categories?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/rental-categories/${id}`),
  create: (data) => api.post('/rental-categories', data),
  update: (id, data) => api.put(`/rental-categories/${id}`, data),
  remove: (id) => api.delete(`/rental-categories/${id}`),
}

export default rentalCategoryService
