import api from './api'

const workerService = {
  getAll: (params) => api.get(`/workers?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/workers/${id}`),
  getBookings: (id) => api.get(`/workers/${id}/bookings`),
  updateStatus: (id, status) => api.put(`/workers/${id}/status`, { status }),
  verify: (id, data) => api.put(`/workers/${id}/verify`, data),
  getEarnings: (id) => api.get(`/workers/${id}/earnings`),
  getRatings: (id) => api.get(`/workers/${id}/ratings`),
  delete: (id) => api.delete(`/workers/${id}`),
}

export default workerService
