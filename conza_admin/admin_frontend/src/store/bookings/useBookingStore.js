import { create } from 'zustand'
import { mockBookings } from '../../mock/bookings'

const useBookingStore = create((set, get) => ({
  bookings: mockBookings,
  selectedBooking: null,
  loading: false,
  filters: { status: 'all', type: 'all', search: '' },
  setFilters: (filters) => set({ filters }),
  selectBooking: (id) => set({ selectedBooking: mockBookings.find((b) => b.id === id) }),
  updateBookingStatus: (id, status) => set((state) => ({
    bookings: state.bookings.map((b) => b.id === id ? { ...b, status } : b)
  })),
  assignWorker: (bookingId, workerId) => set((state) => ({
    bookings: state.bookings.map((b) => b.id === bookingId ? { ...b, workers: [...b.workers, workerId] } : b)
  })),
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
