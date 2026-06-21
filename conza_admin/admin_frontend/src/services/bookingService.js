import api from './api'

const bookingService = {
  getAll: (params) => api.get(`/bookings?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  assignWorker: (id, workerId) => api.put(`/bookings/${id}/assign`, { workerId }),
  resolveDispute: (id, resolution) => api.put(`/bookings/${id}/dispute`, { resolution }),
}

export default bookingService
