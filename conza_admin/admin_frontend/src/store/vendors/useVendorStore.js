import { create } from 'zustand'
import vendorService from '../../services/vendorService'

const mapVendor = (v) => ({ ...v, id: v._id || v.id })

const useVendorStore = create((set, get) => ({
  vendors: [],
  selectedVendor: null,
  loading: true,
  error: null,
  filters: { status: 'all', type: 'all', search: '' },

  setFilters: (filters) => set({ filters }),

  fetchVendors: async () => {
    set({ loading: true, error: null })
    try {
      const res = await vendorService.getAll({ page: 1, limit: 100 })
      if (res.success) {
        set({ vendors: (res.data || []).map(mapVendor), loading: false })
      } else {
        set({ loading: false, error: res.message || 'Failed to load vendors' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load vendors' })
    }
  },

  fetchVendorById: async (id) => {
    const existing = get().vendors.find((v) => v.id === id)
    if (existing) {
      set({ selectedVendor: existing, loading: false, error: null })
      return
    }
    set({ loading: true, error: null, selectedVendor: null })
    try {
      const res = await vendorService.getById(id)
      const vendor = res.vendor || res.data?.vendor
      if (res.success && vendor) {
        set({ selectedVendor: mapVendor(vendor), loading: false })
      } else {
        set({ loading: false, error: res.message || 'Vendor not found' })
      }
    } catch (err) {
      set({ loading: false, error: 'Failed to load vendor' })
    }
  },

  selectVendor: (id) => set((state) => ({
    selectedVendor: state.vendors.find((v) => v.id === id) || null
  })),

  updateVendorStatus: async (id, status) => {
    const res = await vendorService.updateStatus(id, status)
    if (res.success) {
      set((state) => ({
        vendors: state.vendors.map((v) => v.id === id ? { ...v, status } : v),
        selectedVendor: state.selectedVendor && state.selectedVendor.id === id
          ? { ...state.selectedVendor, status }
          : state.selectedVendor,
      }))
    }
    return res
  },

  verifyVendor: async (id, isVerified = true) => {
    const res = await vendorService.verify(id, isVerified)
    if (res.success) {
      const vendor = res.vendor
      set((state) => ({
        vendors: state.vendors.map((v) => v.id === id
          ? { ...v, isVerified: vendor?.isVerified ?? isVerified, status: vendor?.status || v.status }
          : v),
        selectedVendor: state.selectedVendor && state.selectedVendor.id === id
          ? { ...state.selectedVendor, isVerified: vendor?.isVerified ?? isVerified, status: vendor?.status || state.selectedVendor.status }
          : state.selectedVendor,
      }))
    }
    return res
  },

  getFilteredVendors: () => get().vendors,
}))

export default useVendorStore
