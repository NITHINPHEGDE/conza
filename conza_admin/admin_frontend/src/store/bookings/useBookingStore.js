import { create } from 'zustand'
import bookingService from '../../services/bookingService'

const normalizeBooking = (doc) => ({
  ...doc,
  id: doc._id,
  user: doc.user?.fullName || doc.user?.phone || 'N/A',
})

const useBookingStore = create((set, get) => ({
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
  filters: { status: 'all', type: 'all', search: '' },
  setFilters: (filters) => set({ filters }),
  fetchBookings: async () => {
    set({ loading: true, error: null })
    try {
      const res = await bookingService.getAll({})
      const bookings = (res.data || []).map(normalizeBooking)
      set({ bookings, loading: false })
    } catch (err) {
      set({ error: err.message || 'Failed to fetch bookings', loading: false })
    }
  },
  selectBooking: (id) => set({ selectedBooking: get().bookings.find((b) => b.id === id) }),
  updateBookingStatus: async (id, status) => {
    await bookingService.updateStatus(id, status)
    set((state) => ({
      bookings: state.bookings.map((b) => b.id === id ? { ...b, status } : b)
    }))
  },
  assignWorker: async (bookingId, workerId) => {
    await bookingService.assignWorker(bookingId, workerId)
    set((state) => ({
      bookings: state.bookings.map((b) => b.id === bookingId ? { ...b, workers: [...b.workers, workerId] } : b)
    }))
  },
  getFilteredBookings: () => {
    const { bookings, filters } = get()
    return bookings.filter((b) => {
      if (filters.status !== 'all' && b.status !== filters.status) return false
      if (filters.type !== 'all' && b.bookingType !== filters.type) return false
      if (filters.search && !b.id.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  },
  getBookingsByType: (type) => {
    const { bookings, filters } = get()
    return bookings.filter((b) => {
      if (b.bookingType !== type) return false
      if (filters.status !== 'all' && b.status !== filters.status) return false
      if (filters.search && !b.id.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }
}))

export default useBookingStore
