import api from './api'

const customerService = {
  getAll: (params) => api.get(`/customers?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/customers/${id}`),
  updateStatus: (id, status) => api.put(`/customers/${id}/status`, { status }),
  delete: (id) => api.delete(`/customers/${id}`),
  getBookings: (id) => api.get(`/customers/${id}/bookings`),
  getPayments: (id) => api.get(`/customers/${id}/payments`),
  getComplaints: (id) => api.get(`/customers/${id}/complaints`),
  getOrders: (id) => api.get(`/customers/${id}/orders`),
}

export default customerService