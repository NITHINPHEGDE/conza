import { create } from 'zustand'
import mapService from '../../services/mapService'

const useMapStore = create((set) => ({
  workers: [],
  vendors: [],
  loading: false,
  error: null,

  fetchLiveTracking: async () => {
    set({ loading: true, error: null })
    try {
      const res = await mapService.getLiveTracking()
      if (res.success) {
        set({ workers: res.workers, vendors: res.vendors, loading: false })
      } else {
        set({ loading: false, error: res.message || 'Failed to load live tracking data' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load live tracking data' })
    }
  },
}))

export default useMapStore
