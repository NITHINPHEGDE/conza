import api from './api'

const inventoryService = {
  getOverview: () => api.get('/inventory'),
}

export default inventoryService
