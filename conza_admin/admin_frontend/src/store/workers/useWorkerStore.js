import { create } from 'zustand'
import workerService from '../../services/workerService'

const mapWorker = (w) => ({ ...w, id: w._id || w.id })

const useWorkerStore = create((set, get) => ({
  workers: [],
  selectedWorker: null,
  loading: false,
  error: null,
  filters: { status: 'all', category: 'all', search: '' },

  setFilters: (filters) => set({ filters }),

  fetchWorkers: async () => {
    set({ loading: true, error: null })
    try {
      const { filters } = get()
      const params = { page: 1, limit: 200 }
      if (filters.status !== 'all') params.status = filters.status
      if (filters.category !== 'all') params.category = filters.category
      if (filters.search) params.search = filters.search
      const res = await workerService.getAll(params)
      if (res.success) {
        set({ workers: (res.data || []).map(mapWorker), loading: false })
      } else {
        set({ loading: false, error: res.message || 'Failed to load workers' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load workers' })
    }
  },

  fetchWorkerById: async (id) => {
    const existing = get().workers.find((w) => w.id === id)
    if (existing) {
      set({ selectedWorker: existing, loading: false, error: null })
      return
    }
    set({ loading: true, error: null, selectedWorker: null })
    try {
      const res = await workerService.getById(id)
      const worker = res.worker || res.data?.worker
      if (res.success && worker) {
        set({ selectedWorker: mapWorker(worker), loading: false })
      } else {
        set({ loading: false, error: res.message || 'Worker not found' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load worker' })
    }
  },

  selectWorker: (id) => set((state) => ({
    selectedWorker: state.workers.find((w) => w.id === id) || null
  })),

  updateWorkerStatus: async (id, status) => {
    const res = await workerService.updateStatus(id, status)
    if (res.success) {
      set((state) => ({
        workers: state.workers.map((w) => w.id === id ? { ...w, status } : w),
        selectedWorker: state.selectedWorker && state.selectedWorker.id === id
          ? { ...state.selectedWorker, status }
          : state.selectedWorker,
      }))
    }
  },

  verifyWorkerField: async (id, field, value) => {
    const res = await workerService.verify(id, { [field]: value })
    if (res.success) {
      set((state) => ({
        workers: state.workers.map((w) => w.id === id ? { ...w, verification: { ...w.verification, [field]: value } } : w)
      }))
    }
  },

  verifyWorker: async (id) => {
    const res = await workerService.verify(id, { aadhaar: true, pan: true, bank: true, documents: true })
    if (res.success && res.worker) {
      set((state) => ({
        workers: state.workers.map((w) => w.id === id ? mapWorker(res.worker) : w),
        selectedWorker: state.selectedWorker && state.selectedWorker.id === id
          ? mapWorker(res.worker)
          : state.selectedWorker,
      }))
    }
  },

  deleteCustomer: (id) => {
    set((state) => ({
      workers: state.workers.filter((w) => w.id !== id),
    }))
  },

  getFilteredWorkers: () => {
    const { workers } = get()
    return workers
  }
}))

export default useWorkerStore
