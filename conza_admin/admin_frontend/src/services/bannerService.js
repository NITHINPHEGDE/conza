import api from './api'

const bannerService = {
  getAll: (params = {}) => api.get(`/content/banners?${new URLSearchParams(params)}`),
  create: (data) => api.post('/content', data),
  update: (id, data) => api.put(`/content/${id}`, data),
  remove: (id) => api.delete(`/content/${id}`),
}

export default bannerService
