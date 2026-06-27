import api from './api'

// ── FAQ Service ───────────────────────────────────────────────────────────────

export const getFAQs = (params = {}) => {
  const query = new URLSearchParams()
  if (params.appTarget) query.set('appTarget', params.appTarget)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  return api.get(`/faq-help/faqs?${query.toString()}`)
}

export const createFAQ = (data) => api.post('/faq-help/faqs', data)

export const updateFAQ = (id, data) => api.put(`/faq-help/faqs/${id}`, data)

export const deleteFAQ = (id) => api.delete(`/faq-help/faqs/${id}`)

// ── Help Article Service ──────────────────────────────────────────────────────

export const getHelpArticles = (params = {}) => {
  const query = new URLSearchParams()
  if (params.appTarget) query.set('appTarget', params.appTarget)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  return api.get(`/faq-help/help?${query.toString()}`)
}

export const createHelpArticle = (data) => api.post('/faq-help/help', data)

export const updateHelpArticle = (id, data) => api.put(`/faq-help/help/${id}`, data)

export const deleteHelpArticle = (id) => api.delete(`/faq-help/help/${id}`)
