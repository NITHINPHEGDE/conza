import api from './api'

const catalogueProductService = {
  getAll: (params = {}) => api.get(`/catalogue-products?${new URLSearchParams(params)}`),
  getById: (id) => api.get(`/catalogue-products/${id}`),
  create: (data) => api.post('/catalogue-products', data),
  update: (id, data) => api.put(`/catalogue-products/${id}`, data),
  remove: (id) => api.delete(`/catalogue-products/${id}`),
  uploadImage: (imageBase64) => api.post('/catalogue-products/upload-image', { image: imageBase64 }),
}

export default catalogueProductService
