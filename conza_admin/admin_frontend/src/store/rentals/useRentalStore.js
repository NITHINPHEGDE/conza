import { create } from 'zustand'
import rentalService from '../../services/rentalService'

const mapRental = (r) => ({ ...r, id: r._id || r.id })

const useRentalStore = create((set, get) => ({
  rentals: [],
  selectedRental: null,
  loading: true,
  error: null,

  fetchRentals: async () => {
    set({ loading: true, error: null })
    try {
      const res = await rentalService.getAll({ page: 1, limit: 200 })
      if (res.success) {
        set({ rentals: (res.data || []).map(mapRental), loading: false })
      } else {
        set({ loading: false, error: res.message || 'Failed to load rentals' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load rentals' })
    }
  },

  fetchRentalById: async (id) => {
    set({ loading: true, error: null, selectedRental: null })
    try {
      const res = await rentalService.getById(id)
      const rental = res.rental
      if (res.success && rental) {
        set({ selectedRental: mapRental(rental), loading: false })
      } else {
        set({ loading: false, error: res.message || 'Rental not found' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load rental' })
    }
  },

  updateRental: async (id, data) => {
    const res = await rentalService.update(id, data)
    if (res.success && res.rental) {
      const updated = mapRental(res.rental)
      set((state) => ({
        rentals: state.rentals.map((r) => (r.id === id ? updated : r)),
        selectedRental: state.selectedRental?.id === id ? updated : state.selectedRental,
      }))
    }
    return res
  },

  deleteRental: async (id) => {
    const res = await rentalService.remove(id)
    if (res.success) {
      set((state) => ({ rentals: state.rentals.filter((r) => r.id !== id) }))
    }
    return res
  },

  toggleFeatured: async (id) => {
    const res = await rentalService.toggleFeatured(id)
    if (res.success && res.rental) {
      const updated = mapRental(res.rental)
      set((state) => ({
        rentals: state.rentals.map((r) => (r.id === id ? updated : r)),
        selectedRental: state.selectedRental?.id === id ? updated : state.selectedRental,
      }))
    }
    return res
  },
}))

export default useRentalStore
