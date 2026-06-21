import { create } from 'zustand'
import { mockWorkers } from '../../mock/workers'

const useWorkerStore = create((set, get) => ({
  workers: mockWorkers,
  selectedWorker: null,
  loading: false,
  filters: { status: 'all', category: 'all', search: '' },
  setFilters: (filters) => set({ filters }),
  selectWorker: (id) => set({ selectedWorker: mockWorkers.find((w) => w.id === id) }),
  updateWorkerStatus: (id, status) => set((state) => ({
    workers: state.workers.map((w) => w.id === id ? { ...w, status } : w)
  })),
  verifyWorker: (id, field, value) => set((state) => ({
    workers: state.workers.map((w) => w.id === id ? { ...w, verification: { ...w.verification, [field]: value } } : w)
  })),
  getFilteredWorkers: () => {
    const { workers, filters } = get()
    return workers.filter((w) => {
      if (filters.status !== 'all' && w.status !== filters.status) return false
      if (filters.category !== 'all' && w.category !== filters.category) return false
      if (filters.search && !w.fullName.toLowerCase().includes(filters.search.toLowerCase()) && !w.phone.includes(filters.search)) return false
      return true
    })
  }
}))

export default useWorkerStore
