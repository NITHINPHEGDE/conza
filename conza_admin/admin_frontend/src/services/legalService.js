import api from './api'

// ── Legal (Terms & Privacy) — per app ───────────────────────────────────────
export const getLegal = (appTarget) => api.get(`/content/legal/${appTarget}`)

export const saveLegal = (type, appTarget, data) =>
  api.put(`/content/legal/${type}/${appTarget}`, data)

// ── About Us — shared across all apps ───────────────────────────────────────
export const getAboutContent = () => api.get('/content/about-us')

export const saveAboutContent = (data) => api.put('/content/about-us', data)
