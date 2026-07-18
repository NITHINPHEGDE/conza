import api from './api'

const complaintService = {
  getAll: (params) => api.get(`/complaints?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/complaints/${id}`),
  update: (id, data) => api.put(`/complaints/${id}`, data),
}

export default complaintService
