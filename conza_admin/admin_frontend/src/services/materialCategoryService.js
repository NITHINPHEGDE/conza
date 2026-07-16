import api from './api'

const materialCategoryService = {
  getAll: (params = {}) => api.get(`/material-categories?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/material-categories/${id}`),
  create: (data) => api.post('/material-categories', data),
  update: (id, data) => api.put(`/material-categories/${id}`, data),
  remove: (id) => api.delete(`/material-categories/${id}`),
}

export default materialCategoryService
