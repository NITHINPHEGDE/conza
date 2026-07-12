import api from './api'

const mapService = {
  getLiveTracking: () => api.get('/maps/live-tracking'),
}

export default mapService
