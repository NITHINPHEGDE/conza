import api from './api'

const pricingConfigService = {
  getAll: () => api.get('/pricing-config'),
  getByCategory: (category) => api.get(`/pricing-config?category=${category}`),
  save: (category, settings) => api.put(`/pricing-config/${category}`, { settings }),
}

export default pricingConfigService
