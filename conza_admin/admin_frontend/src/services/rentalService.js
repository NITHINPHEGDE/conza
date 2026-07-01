import api from './api'

const rentalService = {
  getAll: (params) => api.get(`/rentals?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/rentals/${id}`),
  update: (id, data) => api.put(`/rentals/${id}`, data),
  remove: (id) => api.delete(`/rentals/${id}`),
  toggleFeatured: (id) => api.put(`/rentals/${id}/feature`),
}

export default rentalService
