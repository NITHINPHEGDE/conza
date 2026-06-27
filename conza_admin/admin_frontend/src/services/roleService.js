import api from './api'

const roleService = {
  getRoles: () => api.get('/roles'),
  getRolePermissions: (id) => api.get(`/roles/${id}/permissions`),
  getPermissions: () => api.get('/roles/permissions'),
  createRole: (data) => api.post('/roles', data),
  updateRole: (id, data) => api.put(`/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/roles/${id}`),
  toggleStatus: (id) => api.patch(`/roles/${id}/toggle-status`),
}

export default roleService
