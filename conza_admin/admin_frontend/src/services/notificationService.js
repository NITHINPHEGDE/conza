import api from './api'

const notificationService = {
  sendPush: (data) => api.post('/notifications/push', data),
  sendSMS: (data) => api.post('/notifications/sms', data),
  sendEmail: (data) => api.post('/notifications/email', data),
  getHistory: (params) => api.get(`/notifications/history?${new URLSearchParams(params)}`),
}

export default notificationService
